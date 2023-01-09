package connection

import (
	"fmt"
	"net"
	"strings"

	"github.com/safing/portmaster/network/netutils"
	"github.com/safing/portmaster/network/packet"
	"gvisor.dev/gvisor/pkg/tcpip/adapters/gonet"
	"gvisor.dev/gvisor/pkg/tcpip/stack"
	"gvisor.dev/gvisor/pkg/tcpip/transport/tcp"
	"gvisor.dev/gvisor/pkg/tcpip/transport/udp"
	"gvisor.dev/gvisor/pkg/waiter"
)

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
	remoteConn, tcpErr := net.Dial("tcp", remote)
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
	remoteConn, tcpErr := net.Dial("udp", remote)
	if tcpErr != nil {
		return fmt.Errorf("failed to establish connection to remote host %s: %s", remote, tcpErr)
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
	scope := netutils.GetIPScope(net.IP(fr.ID().LocalAddress))
	if scope == netutils.Global {
		return routeTCPThroughSPN(fr)
	} else {
		return routeTCPThroughDefaultInterface(fr)
	}
}

func DefaultUDPRouting(stack *stack.Stack, fr *udp.ForwarderRequest) error {
	scope := netutils.GetIPScope(net.IP(fr.ID().LocalAddress))
	if scope == netutils.Global {
		return routeUDPThroughSPN(stack, fr)
	} else {
		return routeUDPThroughDefaultInterface(stack, fr)
	}
}

func EndAll() {
	endAllDefaultConnections()
}
