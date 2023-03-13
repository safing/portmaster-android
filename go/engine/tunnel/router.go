package tunnel

import (
	"fmt"
	"net"
	"strings"
	"syscall"

	"github.com/safing/portbase/config"
	"github.com/safing/portbase/database"
	"github.com/safing/portbase/log"
	"github.com/safing/portmaster-android/go/app_interface"
	"github.com/safing/portmaster/network/netutils"
	"github.com/safing/portmaster/network/packet"
	"github.com/safing/spn/captain"
	"gvisor.dev/gvisor/pkg/tcpip/adapters/gonet"
	"gvisor.dev/gvisor/pkg/tcpip/stack"
	"gvisor.dev/gvisor/pkg/tcpip/transport/tcp"
	"gvisor.dev/gvisor/pkg/tcpip/transport/udp"
	"gvisor.dev/gvisor/pkg/waiter"
)

var (
	isSpnEnabled      config.BoolOption
	dialerNotTunneled net.Dialer
	dbInterface       *database.Interface
	ownUID            int
)

func initializeRouter() {
	initializeDialer()
	isSpnEnabled = config.Concurrent.GetAsBool(captain.CfgOptionEnableSPNKey, false)
	var err error
	ownUID, err = app_interface.GetAppUID()
	if err != nil {
		log.Errorf("tunnel: failed to get app UID: %s", err)
	}
}

func initializeDialer() {
	dialerNotTunneled = net.Dialer{
		Control: func(network, address string, c syscall.RawConn) error {
			c.Control(func(fd uintptr) {
				err := app_interface.SetDefaultInterfaceForSocket(fd)
				if err != nil {
					log.Errorf("tunnel: failed to disable tunnel for connection: %s", err)
				}
			})
			return nil
		},
	}
}

func routeTCPThroughSPN(fr *tcp.ForwarderRequest) error {
	ipVersion := packet.IPv4
	if strings.Contains(fr.ID().LocalAddress.String(), ":") {
		ipVersion = packet.IPv6
	}

	remoteAddr := Addr{
		ip:        net.IP(fr.ID().LocalAddress),
		port:      fr.ID().LocalPort,
		ipVersion: ipVersion,
		protocol:  packet.TCP,
	}

	localAddr := Addr{
		ip:        net.IP(fr.ID().RemoteAddress),
		port:      fr.ID().RemotePort,
		ipVersion: ipVersion,
		protocol:  packet.TCP,
	}

	var wq waiter.Queue
	ep, err := fr.CreateEndpoint(&wq)
	if err != nil {
		return fmt.Errorf("failed to create endpoint for: %s", err)
	}

	systemConn := gonet.NewTCPConn(&wq, ep)
	addSPNConnection(systemConn, localAddr, remoteAddr)

	return nil
}

func routeUDPThroughSPN(stack *stack.Stack, fr *udp.ForwarderRequest) error {
	ipVersion := packet.IPv4
	if strings.Contains(fr.ID().LocalAddress.String(), ":") {
		ipVersion = packet.IPv6
	}

	remoteAddr := Addr{
		ip:        net.IP(fr.ID().LocalAddress),
		port:      fr.ID().LocalPort,
		ipVersion: ipVersion,
		protocol:  packet.UDP,
	}

	localAddr := Addr{
		ip:        net.IP(fr.ID().RemoteAddress),
		port:      fr.ID().RemotePort,
		ipVersion: ipVersion,
		protocol:  packet.UDP,
	}

	var wq waiter.Queue
	ep, err := fr.CreateEndpoint(&wq)
	if err != nil {
		return fmt.Errorf("failed to create endpoint for: %s", err)
	}

	systemConn := gonet.NewUDPConn(stack, &wq, ep)
	addSPNConnection(systemConn, localAddr, remoteAddr)

	return nil
}

func routeTCPThroughDefaultInterface(fr *tcp.ForwarderRequest) error {
	remote := fmt.Sprintf("%s:%d", fr.ID().LocalAddress.String(), fr.ID().LocalPort)

	remoteConn, tcpErr := dialerNotTunneled.Dial("tcp", remote)
	if tcpErr != nil {
		return fmt.Errorf("failed to establish connection to remote host %s: %s", remote, tcpErr)
	}

	var wq waiter.Queue
	ep, err := fr.CreateEndpoint(&wq)
	if err != nil {
		remoteConn.Close()
		return fmt.Errorf("failed to create endpoint for remote %s: %s", remote, err)
	}

	systemConn := gonet.NewTCPConn(&wq, ep)
	addDefaultConnection(systemConn, remoteConn, ep)
	return nil
}

func routeUDPThroughDefaultInterface(stack *stack.Stack, fr *udp.ForwarderRequest) error {
	remote := fmt.Sprintf("%s:%d", fr.ID().LocalAddress.String(), fr.ID().LocalPort)
	remoteConn, udpErr := dialerNotTunneled.Dial("udp", remote)
	if udpErr != nil {
		return fmt.Errorf("failed to establish connection to remote host %s: %s", remote, udpErr)
	}

	var wq waiter.Queue
	ep, err := fr.CreateEndpoint(&wq)
	if err != nil {
		remoteConn.Close()
		return fmt.Errorf("failed to create endpoint for remote %s: %s", remote, err)
	}

	systemConn := gonet.NewUDPConn(stack, &wq, ep)
	addDefaultConnection(systemConn, remoteConn, ep)
	return nil
}

func DefaultTCPRouting(fr *tcp.ForwarderRequest) error {
	ipAddress := net.IP(fr.ID().LocalAddress)
	scope := netutils.GetIPScope(ipAddress)

	// Exception for the spn connection
	if captain.IsExcepted(ipAddress) {
		return routeTCPThroughDefaultInterface(fr)
	}

	if scope == netutils.Global {
		if isSpnEnabled() && captain.ClientReady() {
			return routeTCPThroughSPN(fr)
		}
	}

	return routeTCPThroughDefaultInterface(fr)
}

func getUidOfTCPRequest(fr *tcp.ForwarderRequest) (int, error) {
	conn := app_interface.Connection{
		Protocol: 6, // TCP

		LocalIP:   net.IP(fr.ID().RemoteAddress),
		LocalPort: int(fr.ID().RemotePort),

		RemoteIP:   net.IP(fr.ID().LocalAddress),
		RemotePort: int(fr.ID().LocalPort),
	}
	return app_interface.GetConnectionOwner(conn)
}

func DefaultUDPRouting(stack *stack.Stack, fr *udp.ForwarderRequest) error {
	ipAddress := net.IP(fr.ID().LocalAddress)

	scope := netutils.GetIPScope(ipAddress)
	if scope == netutils.Global {
		if isSpnEnabled() && captain.ClientReady() {
			return routeUDPThroughSPN(stack, fr)
		}
	}

	return routeUDPThroughDefaultInterface(stack, fr)
}

// func handleDNS(stack *stack.Stack, fr *udp.ForwarderRequest) {
// 	var wq waiter.Queue
// 	ep, err := fr.CreateEndpoint(&wq)
// 	if err != nil {
// 		log.Errorf("failed to handle udp request: %s", err.String())
// 		return
// 	}

// 	c := gonet.NewUDPConn(stack, &wq, ep)

// 	go func() {
// 		defer c.Close()
// 		c.SetReadDeadline(time.Now().Add(10 * time.Second))

// 		var frame [1500]byte
// 		n, err := c.Read(frame[:])
// 		if err != nil {
// 			return
// 		}
// 		response, err := ResolveQuery(frame[:n])
// 		if err == nil {
// 			c.Write(response)
// 		}
// 		// packet := gopacket.NewPacket(frame[:n], layers.LayerTypeDNS, gopacket.Default)

// 		// dns, _ := packet.Layer(layers.LayerTypeDNS).(*layers.DNS)

// 		// log.Infof("tunnel: Question: %s", string(dns.Questions[0].Name))
// 		// remoteConn.Write(frame[:n])
// 		// n, err = remoteConn.Read(frame[:])

// 	}()
// }

func EndAllConnections() {
	endAllDefaultConnections()
}
