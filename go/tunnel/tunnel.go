package tunnel

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"strconv"
	"strings"
	"syscall"

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

const spnLibVersion = "v0.0.3-alpha"

type NetInterface struct {
	Interface *net.Interface
	Addresses []tcpip.ProtocolAddress
	Flags     net.Flags
}

var (
	netStack          *stack.Stack
	networkInterfaces []NetInterface
	connections       []*Connection

	stateChannel = make(chan bool)
)

// Version version fo the module
func Version() string {
	return spnLibVersion
}

// onConnectionEnd end connection callback
func onConnectionEnd(conn *Connection) {
	conn.close()
	for i, c := range connections {
		if c == conn {
			connections = append(connections[:i], connections[i+1:]...)
			return
		}
	}
}

// Starts the tunneling
func Start(fd int) error {
	log.Printf("Starting spn")
	mtu := uint32(1400)

	maddr, err := net.ParseMAC("aa:00:17:17:17:17")
	if err != nil {
		log.Fatalf("spn: invalid mac address")
	}

	// try to make the socket non-blocking
	if err := syscall.SetNonblock(fd, true); err != nil {
		return fmt.Errorf("failed to set socket non-blocking: %w", err)
	}

	linkID, err := fdbased.New(&fdbased.Options{
		FDs:            []int{fd},
		MTU:            mtu,
		EthernetHeader: false,
		Address:        tcpip.LinkAddress(maddr),
		ClosedFunc: func(err tcpip.Error) {
			if err != nil {
				log.Printf("spn: file descriptor closed: %s", err)
			}
			log.Printf("spn: file descriptor for linkID closed")
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create linkID: %w", err)
	}

	log.Printf("spn: created LinkID: %+v", linkID)

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
		return fmt.Errorf("could not enable TCP SACK: %v", tcpipErr)
	}

	//
	// NIC Setup
	//
	if err := newStack.CreateNIC(nicID, linkID); err != nil {
		return fmt.Errorf("failed to create nic: %s", err.String())
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
	var tunnelInterface *NetInterface
	for index, i := range networkInterfaces {
		if strings.HasPrefix(i.Interface.Name, "tun") {
			tunnelInterface = &networkInterfaces[index]
		}
	}

	// Setting the IP4/6 addresses to the interface
	if tunnelInterface != nil {
		for _, addr := range tunnelInterface.Addresses {
			newStack.AddProtocolAddress(nicID, addr, stack.AddressProperties{
				PEB:        stack.CanBePrimaryEndpoint, // zero value default
				ConfigType: stack.AddressConfigStatic,  // zero value default
			})
		}
	}

	if err := newStack.SetPromiscuousMode(nicID, true); err != nil {
		return fmt.Errorf("failed to enable promiscuous mode: %s", err)
	}

	// newStack.AddTCPProbe(func(state *stack.TCPEndpointState) {
	// 	log.Printf("spn: received probe: %+v", state.ID)
	// })

	// Setup TCP forwarding
	// TODO (vladimir): Max in-flight is it to high?
	tcpForwarder := tcp.NewForwarder(newStack, 0, 5000, func(fr *tcp.ForwarderRequest) {
		remote := fmt.Sprintf("%s:%d", fr.ID().LocalAddress.String(), fr.ID().LocalPort)
		conn, err := tryToConnectTCP(remote, fr)
		if err != nil {
			log.Printf("spn: failed to connect: %s", err)
			return
		}
		conn.forward(onConnectionEnd)
		connections = append(connections, conn)

	})
	newStack.SetTransportProtocolHandler(tcp.ProtocolNumber, tcpForwarder.HandlePacket)

	// Setup UDP forwarding
	udpForwarder := udp.NewForwarder(newStack, func(fr *udp.ForwarderRequest) {
		remote := fmt.Sprintf("%s:%d", fr.ID().LocalAddress.String(), fr.ID().LocalPort)
		conn, err := tryToConnectUDP(newStack, remote, fr)
		if err != nil {
			log.Printf("spn: failed to connect: %s", err)
			return
		}
		conn.forward(onConnectionEnd)
		connections = append(connections, conn)
	})
	newStack.SetTransportProtocolHandler(udp.ProtocolNumber, udpForwarder.HandlePacket)

	// newStack.SetICMPLimit(0)
	// newStack.SetNICForwarding(nicID, ipv4.ProtocolNumber, true)

	netStack = newStack
	stateChannel <- true

	return nil
}

// Stops the tunneling
func Stop() {
	if connections != nil {
		for _, c := range connections {
			c.close()
		}
		connections = nil
	}

	if netStack != nil {
		netStack.Close()
		netStack.Wait()
		netStack = nil
		stateChannel <- false
	}
}

func IsActive() bool {
	return netStack != nil
}

// SetNetworkInterfaces parses network interfaces from a json string. Send from Java.
func SetNetworkInterfaces(jsonString string) {

	log.Println(jsonString)

	// example json:
	// [
	// ...
	// {
	//      "name": "tun0",
	//      "index": 38,
	//      "MTU": 1500,
	//      "up": true,
	//      "multicast": false,
	//      "loopback": false,
	//      "p2p": true,
	//      "addresses": "[fe80::35ff:6787:42a4:4357%tun0\/64 , 10.0.2.15\/24 ]"
	// }
	// ...
	// ]

	var parsedInterfaces []struct {
		Name      string
		Index     int
		MTU       int
		Up        bool
		Multicast bool
		Loopback  bool
		P2P       bool
		Addresses []string
	}

	err := json.Unmarshal([]byte(jsonString), &parsedInterfaces)
	if err != nil {
		log.Printf("Failed to unmarshal json: %s", err)
		return
	}

	for _, i := range parsedInterfaces {
		newIf := NetInterface{
			Interface: &net.Interface{
				Name:  i.Name,
				Index: i.Index,
				MTU:   i.MTU,
			},
			Addresses: []tcpip.ProtocolAddress{},
		}

		if i.Up {
			newIf.Flags |= net.FlagUp
		}
		if i.Loopback {
			newIf.Flags |= net.FlagLoopback
		}
		if i.P2P {
			newIf.Flags |= net.FlagPointToPoint
		}
		if i.Multicast {
			newIf.Flags |= net.FlagMulticast
			newIf.Flags |= net.FlagBroadcast
		}

		for _, strAddr := range i.Addresses {
			addrAndPrefix := strings.Split(strAddr, "/")
			if len(addrAndPrefix) != 2 {
				continue
			}

			netPrefix, err := strconv.Atoi(strings.TrimSpace(addrAndPrefix[1]))
			if err != nil {
				continue
			}

			protocolAddress := tcpip.ProtocolAddress{
				AddressWithPrefix: tcpip.AddressWithPrefix{
					Address:   tcpip.Address(addrAndPrefix[0]),
					PrefixLen: netPrefix,
				},
			}
			newIf.Addresses = append(newIf.Addresses, protocolAddress)
		}

		networkInterfaces = append(networkInterfaces, newIf)
	}

	log.Printf("spn: %d interfaces parsed", len(networkInterfaces))
}
