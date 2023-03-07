package tunnel

import (
	"context"
	"math/rand"
	"net"
	"os"
	"strings"
	"syscall"

	"github.com/safing/portbase/log"
	"github.com/safing/portbase/modules"
	"github.com/safing/portmaster-android/go/app_interface"
	"gvisor.dev/gvisor/pkg/tcpip"
	"gvisor.dev/gvisor/pkg/tcpip/header"
	"gvisor.dev/gvisor/pkg/tcpip/link/fdbased"
	"gvisor.dev/gvisor/pkg/tcpip/network/ipv4"
	"gvisor.dev/gvisor/pkg/tcpip/network/ipv6"
	"gvisor.dev/gvisor/pkg/tcpip/stack"
	"gvisor.dev/gvisor/pkg/tcpip/transport/icmp"
	"gvisor.dev/gvisor/pkg/tcpip/transport/tcp"
	"gvisor.dev/gvisor/pkg/tcpip/transport/udp"
)

var (
	netStack *stack.Stack
	tunnelFD *os.File
	module   *modules.Module

	eventChannel chan string
)

func init() {
	eventChannel = make(chan string)
	module = modules.Register("vpn-service", nil, start, nil, "base")
	module.Enable()
}

func start() error {
	module.StartServiceWorker("vpn-service-manager", 0, func(ctx context.Context) error {
		// Listen for new events.
		for {
			select {
			case command := <-eventChannel:
				switch command {
				case "connect":
					if !IsActive() {
						setupTunnelInterface()

						// Sending command, so the app can run in the background
						app_interface.SendServicesCommand("keep_alive")
					}
				case "disconnect":
					destroyTunnelInterface()
					// Disable background service. When the app is killed everything will shutdown.
					app_interface.SendServicesCommand("shutdown")
				case "reconnect":
					destroyTunnelInterface()
					setupTunnelInterface()
				case "system-shutdown":
					log.Errorf("vpn-service: the VPN service has stopped, restart the app to start it again.")
					notification := &app_interface.Notification{
						ID: rand.Int31(),
					}
					notification.Title = "The system stopped Portmaster"
					notification.Message = "Tap here to restart it"
					app_interface.ShowNotification(notification)
					destroyTunnelInterface()
					app_interface.SendServicesCommand("shutdown")
					err := app_interface.Shutdown()
					if err != nil {
						log.Errorf("vpn-service: failed to call activity shutdown: %s", err)
					}
				}
			case <-ctx.Done():
				destroyTunnelInterface()
				app_interface.SendServicesCommand("shutdown")
				return nil
			}
		}
	})
	return nil
}

func Enable() {
	eventChannel <- "connect"
}

func Disable() {
	eventChannel <- "disconnect"
}

func Reconnect() {
	eventChannel <- "reconnect"
}

func SystemShutdown() {
	eventChannel <- "system-shutdown"
}

// enableTunnel starts the tunneling.
func setupTunnelInterface() {
	// Request file descriptor from java
	fd, err := app_interface.VPNInit()
	if err != nil {
		log.Errorf("vpn-service: failed to initialize file descriptor: %s", err)
		return
	}

	tunnelFD = os.NewFile(uintptr(fd), "tunnel")

	initializeRouter()

	log.Info("vpn-service: initializing tunnel interface")
	mtu := uint32(1400)

	maddr, err := net.ParseMAC("aa:00:17:17:17:17")
	if err != nil {
		log.Errorf("vpn-service: invalid mac address")
	}

	// try to make the socket non-blocking
	if err := syscall.SetNonblock(fd, true); err != nil {
		log.Errorf("vpn-service: failed to set socket to non-blocking: %w", err)
		return
	}

	linkID, err := fdbased.New(&fdbased.Options{
		FDs:            []int{fd},
		MTU:            mtu,
		EthernetHeader: false,
		Address:        tcpip.LinkAddress(maddr),
		ClosedFunc: func(err tcpip.Error) {
			if err != nil {
				log.Errorf("vpn-service: file descriptor closed: %s", err)
			}
		},
	})
	if err != nil {
		log.Errorf("vpn-service: failed to create linkID: %s", err)
		return
	}

	log.Infof("vpn-service: created LinkID: %+v", linkID)

	nicID := tcpip.NICID(1)

	opts := stack.Options{
		NetworkProtocols:   []stack.NetworkProtocolFactory{ipv4.NewProtocol, ipv6.NewProtocol},
		TransportProtocols: []stack.TransportProtocolFactory{tcp.NewProtocol, udp.NewProtocol, icmp.NewProtocol4, icmp.NewProtocol6},
	}

	newStack := stack.New(opts)

	// TODO (vladimir): do we need TCP SACK?
	sackEnabledOpt := tcpip.TCPSACKEnabled(true)
	tcpipErr := newStack.SetTransportProtocolOption(tcp.ProtocolNumber, &sackEnabledOpt)
	if tcpipErr != nil {
		log.Errorf("vpn-service: could not enable TCP SACK: %s", tcpipErr)
	}

	//
	// NIC Setup
	//
	if err := newStack.CreateNIC(nicID, linkID); err != nil {
		log.Errorf("vpn-service: failed to create nic: %s", err)
		return
	}

	newStack.SetSpoofing(nicID, true)
	newStack.SetRouteTable([]tcpip.Route{
		{
			Destination: header.IPv4EmptySubnet,
			NIC:         nicID,
		},
		{
			Destination: header.IPv6EmptySubnet,
			NIC:         nicID,
		},
	})

	// Finding the tunnel interface that was set from Java
	var tunnelInterface *app_interface.NetworkInterface
	interfaces, err := app_interface.GetNetworkInterfaces()
	if err != nil {
		log.Errorf("vpn-service: failed to get network interfaces: %s", err)
		return
	}
	for _, i := range interfaces {
		if strings.HasPrefix(i.Name, "tun") {
			tunnelInterface = &i
		}
	}

	// Setting the IP4/6 addresses to the interface
	if tunnelInterface != nil {
		for _, addr := range tunnelInterface.GetProtocolAddresses() {
			newStack.AddProtocolAddress(nicID, addr, stack.AddressProperties{
				PEB:        stack.CanBePrimaryEndpoint, // zero value default
				ConfigType: stack.AddressConfigStatic,  // zero value default
			})
		}
	}

	if err := newStack.SetPromiscuousMode(nicID, true); err != nil {
		log.Errorf("vpn-service: failed to enable promiscuous mode: %s", err)
		return
	}

	// newStack.AddTCPProbe(func(state *stack.TCPEndpointState) {
	// 	log.Printf("spn: received probe: %+v", state.ID)
	// })

	// Setup TCP forwarding
	// TODO (vladimir): Max in-flight is it to high?
	tcpForwarder := tcp.NewForwarder(newStack, 0, 32, func(fr *tcp.ForwarderRequest) {
		err := DefaultTCPRouting(fr)
		if err != nil {
			// log.Errorf("vpn-service: failed to route connection: %s", err)
			fr.Complete(true)
		} else {
			fr.Complete(false)
		}
	})
	newStack.SetTransportProtocolHandler(tcp.ProtocolNumber, tcpForwarder.HandlePacket)

	// Setup UDP forwarding
	udpForwarder := udp.NewForwarder(newStack, func(fr *udp.ForwarderRequest) {
		err := DefaultUDPRouting(newStack, fr)
		if err != nil {
			// log.Errorf("vpn-service: failed to route connection: %s", err)
		}
	})
	newStack.SetTransportProtocolHandler(udp.ProtocolNumber, udpForwarder.HandlePacket)

	// newStack.SetICMPLimit(0)
	// newStack.SetNICForwarding(nicID, ipv4.ProtocolNumber, true)

	netStack = newStack

	//InitializeResolver()
}

func destroyTunnelInterface() {
	log.Info("vpn-service: shuting down tunnel interface")

	// Close and wait for all connections to end
	EndAllConnections()

	// Close the gvisor net stack
	if netStack != nil {
		netStack.Close()
		netStack.Wait()
		netStack = nil
	}

	// Close the NIC file descriptor
	if tunnelFD != nil {
		tunnelFD.Close()
	}
}

// IsActive checks if the tunnel is initialized
func IsActive() bool {
	return netStack != nil
}
