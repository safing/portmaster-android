package tunnel

import (
	"fmt"
	"net"
	"os"
	"strings"
	"syscall"

	"github.com/safing/portbase/log"
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

type NetInterface struct {
	Interface *net.Interface
	Addresses []tcpip.ProtocolAddress
}

var (
	netStack *stack.Stack
	tunnelFD *os.File
)

// enableTunnel starts the tunneling.
func enableTunnel(fd int) error {
	if fd == 0 {
		return fmt.Errorf("tunnel: invalid file descriptor")
	}

	tunnelFD = os.NewFile(uintptr(fd), "tunnel")

	log.Info("portmaster/android: initializing tunnel interface")
	mtu := uint32(1400)

	maddr, err := net.ParseMAC("aa:00:17:17:17:17")
	if err != nil {
		log.Errorf("portmaster/android: invalid mac address")
	}

	// try to make the socket non-blocking
	if err := syscall.SetNonblock(fd, true); err != nil {
		err := fmt.Errorf("failed to set socket to non-blocking: %w", err)
		log.Errorf("portmaster/android: %s", err)
		return err
	}

	linkID, err := fdbased.New(&fdbased.Options{
		FDs:            []int{fd},
		MTU:            mtu,
		EthernetHeader: false,
		Address:        tcpip.LinkAddress(maddr),
		ClosedFunc: func(err tcpip.Error) {
			if err != nil {
				log.Errorf("portmaster/android: file descriptor closed: %s", err)
			}
			log.Criticalf("portmaster/android: file descriptor for linkID closed")
		},
	})
	if err != nil {
		err := fmt.Errorf("failed to create linkID: %w", err)
		log.Errorf("portmaster/android: %s", err)
		return err
	}

	log.Infof("portmaster/android: created LinkID: %+v", linkID)

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
		err := fmt.Errorf("could not enable TCP SACK: %v", tcpipErr)
		log.Errorf("portmaster/android: %s", err)
		return err
	}

	//
	// NIC Setup
	//
	if err := newStack.CreateNIC(nicID, linkID); err != nil {
		err := fmt.Errorf("failed to create nic: %s", err.String())
		log.Errorf("portmaster/android: %s", err)
		return err
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

	// Getting the tunnel interface that was send from Java
	var tunnelInterface *app_interface.NetworkInterface
	interfaces, err := app_interface.GetNetworkInterfaces()
	if err != nil {
		err := fmt.Errorf("failed to get network interfaces: %s", err)
		log.Errorf("portmaster/android: %s", err)
		return err
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
		err := fmt.Errorf("failed to enable promiscuous mode: %s", err)
		log.Errorf("portmaster/android: %s", err)
		return err
	}

	// newStack.AddTCPProbe(func(state *stack.TCPEndpointState) {
	// 	log.Printf("spn: received probe: %+v", state.ID)
	// })

	// Setup TCP forwarding
	// TODO (vladimir): Max in-flight is it to high?
	tcpForwarder := tcp.NewForwarder(newStack, 0, 5000, func(fr *tcp.ForwarderRequest) {
		err := DefaultTCPRouting(fr)
		if err != nil {
			log.Errorf("spn: failed to route connection: %s", err)
		}
	})
	newStack.SetTransportProtocolHandler(tcp.ProtocolNumber, tcpForwarder.HandlePacket)

	// Setup UDP forwarding
	udpForwarder := udp.NewForwarder(newStack, func(fr *udp.ForwarderRequest) {
		err := DefaultUDPRouting(newStack, fr)
		if err != nil {
			log.Errorf("spn: failed to route connection: %s", err)
		}
	})
	newStack.SetTransportProtocolHandler(udp.ProtocolNumber, udpForwarder.HandlePacket)

	// newStack.SetICMPLimit(0)
	// newStack.SetNICForwarding(nicID, ipv4.ProtocolNumber, true)

	netStack = newStack
	return nil
}

// DisableTunnel stops the tunneling.
func disableTunnel() {
	log.Info("portmaster/android: shuting down tunnel interface")
	EndAllConnections()

	if netStack != nil {
		netStack.Close()
		netStack.Wait()
		netStack = nil
	}

	if tunnelFD != nil {
		tunnelFD.Close()
	}

	_ = app_interface.SendUIWindowEvent("Tunnel", `{"TunnelEnabled": false}`)
}

func IsActive() bool {
	return netStack != nil
}
