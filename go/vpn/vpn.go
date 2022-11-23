package vpn

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
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

const vpnLibVersion = "v0.0.3-alpha"

type NetInterface struct {
	Interface *net.Interface
	AltAddrs  []net.Addr
	Flags     net.Flags
}

var networkInterfaces []NetInterface
var netStack *stack.Stack = nil

var connections []*Connection

type PluginCall interface {
	Resolve()
	ResolveJson(obj string)
	GetArgs() string
}

// Version version fo the module
func Version() string {
	return vpnLibVersion
}

func onConnectionEnd(conn *Connection) {
	for i, c := range connections {
		if c == conn {
			c.close()
			connections = append(connections[:i], connections[i+1:]...)
			return
		}
	}
}

func Start(fd int) error {

	log.Printf("Starting spn")
	mtu := uint32(1400)

	maddr, err := net.ParseMAC("aa:00:17:17:17:17")
	if err != nil {
		log.Fatalf("spn: Bad MAC address")
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
				log.Printf("spn: File descriptor closed: %s", err)
			}
			log.Printf("spn: File descriptor for linkID closed")
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create linkID: %w", err)
	}

	log.Printf("spn: created LinkID: %s", linkID)

	nicID := tcpip.NICID(1)

	opts := stack.Options{
		NetworkProtocols:   []stack.NetworkProtocolFactory{ipv4.NewProtocol, ipv6.NewProtocol},
		TransportProtocols: []stack.TransportProtocolFactory{tcp.NewProtocol, udp.NewProtocol, icmp.NewProtocol4, icmp.NewProtocol6},
	}

	newStack := stack.New(opts)

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

	protocolAddress := tcpip.ProtocolAddress{
		AddressWithPrefix: tcpip.AddressWithPrefix{
			Address:   tcpip.Address("10.0.2.15"),
			PrefixLen: 24,
		},
	}

	newStack.AddProtocolAddress(nicID, protocolAddress, stack.AddressProperties{
		PEB:        stack.CanBePrimaryEndpoint, // zero value default
		ConfigType: stack.AddressConfigStatic,  // zero value default
	})

	if err := newStack.SetPromiscuousMode(nicID, true); err != nil {
		return fmt.Errorf("failed to enable promiscuous mode: %s", err)
	}

	// newStack.AddTCPProbe(func(state *stack.TCPEndpointState) {
	// 	log.Printf("spn: received probe: %+v", state.ID)
	// })

	tcpForwarder := tcp.NewForwarder(newStack, 30000, 5000, func(fr *tcp.ForwarderRequest) {
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

	return nil
}

func Stop() {
	for _, c := range connections {
		c.close()
	}
	connections = nil

	if netStack != nil {
		netStack.Close()
		netStack.Wait()
		netStack = nil
	}
}

func IsActive() bool {
	return netStack != nil
}

func IsActiveUI(call PluginCall) {
	call.ResolveJson(`{"active": true}`)
}

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
			AltAddrs: []net.Addr{},
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

		networkInterfaces = append(networkInterfaces, newIf)
	}
	log.Printf("parsed %+v", networkInterfaces)
}
