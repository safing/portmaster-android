package tunnel

import (
	"fmt"
	"io"
	"net"
	"time"

	"github.com/safing/portmaster/network"
	"github.com/safing/portmaster/network/netutils"
	"github.com/safing/spn/crew"
	"gvisor.dev/gvisor/pkg/tcpip"
	"gvisor.dev/gvisor/pkg/tcpip/adapters/gonet"
	"gvisor.dev/gvisor/pkg/tcpip/stack"
	"gvisor.dev/gvisor/pkg/tcpip/transport/tcp"
	"gvisor.dev/gvisor/pkg/tcpip/transport/udp"
	"gvisor.dev/gvisor/pkg/waiter"
)

type InternalConnection interface {
	io.Reader
	io.Writer
	Close() error
}

type Connection struct {
	internal InternalConnection
	external net.Conn
	endpoint tcpip.Endpoint
}

type ConnAddr struct {
	ip       net.IP
	port     uint16
	protocol uint8
}

func (a ConnAddr) Network() string {
	if a.protocol == 6 {
		return "tcp"
	}
	if a.protocol == 17 {
		return "udp"
	}

	return ""
}

func (a ConnAddr) String() string {
	return fmt.Sprintf("%s:%d", a.ip, a.port)
}

type ConnWrapper struct {
	conn       io.ReadWriteCloser
	localAddr  ConnAddr
	remoteAddr ConnAddr
}

func (c ConnWrapper) Read(b []byte) (n int, err error) {
	return c.conn.Read(b)
}

func (c ConnWrapper) Write(b []byte) (n int, err error) {
	return c.conn.Write(b)
}

func (c ConnWrapper) Close() error {
	return c.conn.Close()
}

func (c ConnWrapper) LocalAddr() net.Addr {
	return c.localAddr
}

func (c ConnWrapper) RemoteAddr() net.Addr {
	return c.remoteAddr
}

func (c ConnWrapper) SetDeadline(t time.Time) error {
	return nil
}

func (c ConnWrapper) SetReadDeadline(t time.Time) error {
	return nil
}

func (c ConnWrapper) SetWriteDeadline(t time.Time) error {
	return nil
}

func tryToConnectTCP(fr *tcp.ForwarderRequest) (*Connection, error) {
	scope := netutils.GetIPScope(net.IP(fr.ID().LocalAddress))
	if scope == netutils.Global {
		return routeTCPThroughSPN(fr)
	}
	remote := fmt.Sprintf("%s:%d", fr.ID().LocalAddress.String(), fr.ID().LocalPort)
	externalConn, tcpErr := net.Dial("tcp", remote)
	if tcpErr != nil {
		return nil, fmt.Errorf("failed to establish connection to remote host %s: %s", remote, tcpErr)
	}

	var wq waiter.Queue
	ep, err := fr.CreateEndpoint(&wq)
	if err != nil {
		externalConn.Close()
		return nil, fmt.Errorf("failed to create endpoint for remote %s: %s", remote, err)
	}

	internalConn := gonet.NewTCPConn(&wq, ep)

	return &Connection{
		external: externalConn,
		internal: internalConn,
		endpoint: ep,
	}, nil
}

func routeTCPThroughSPN(fr *tcp.ForwarderRequest) (*Connection, error) {
	remoteAddr := ConnAddr{
		ip:       net.IP(fr.ID().LocalAddress),
		port:     fr.ID().LocalPort,
		protocol: 6,
	}
	localAddr := ConnAddr{
		ip:       net.IP(fr.ID().RemoteAddress),
		port:     fr.ID().RemotePort,
		protocol: 6,
	}
	connInfo := network.NewConnectionFromTCPConnection(localAddr.ip, localAddr.port, remoteAddr.ip, remoteAddr.port)

	var wq waiter.Queue
	ep, err := fr.CreateEndpoint(&wq)
	if err != nil {
		return nil, fmt.Errorf("failed to create endpoint for: %s", err)
	}

	internalConn := gonet.NewTCPConn(&wq, ep)

	conn := ConnWrapper{
		localAddr:  localAddr,
		remoteAddr: remoteAddr,
		conn:       internalConn,
	}

	crew.HandleSluiceRequest(connInfo, conn)
	return nil, nil
}

func tryToConnectUDP(stack *stack.Stack, fr *udp.ForwarderRequest) (*Connection, error) {
	scope := netutils.GetIPScope(net.IP(fr.ID().LocalAddress))
	if scope == netutils.Global {
		return routeUDPThroughSPN(stack, fr)
	}
	remote := fmt.Sprintf("%s:%d", fr.ID().LocalAddress.String(), fr.ID().LocalPort)
	externalConn, udpErr := net.Dial("udp", remote)
	if udpErr != nil {
		return nil, fmt.Errorf("failed to establish connection to remote host %s: %s", remote, udpErr)
	}

	var wq waiter.Queue
	ep, err := fr.CreateEndpoint(&wq)
	if err != nil {
		externalConn.Close()
		return nil, fmt.Errorf("failed to create endpoint for remote %s: %s", remote, err)
	}

	internalConn := gonet.NewUDPConn(stack, &wq, ep)

	return &Connection{
		external: externalConn,
		internal: internalConn,
		endpoint: ep,
	}, nil
}

func routeUDPThroughSPN(stack *stack.Stack, fr *udp.ForwarderRequest) (*Connection, error) {
	remoteAddr := ConnAddr{
		ip:       net.IP(fr.ID().LocalAddress),
		port:     fr.ID().LocalPort,
		protocol: 17,
	}
	localAddr := ConnAddr{
		ip:       net.IP(fr.ID().RemoteAddress),
		port:     fr.ID().RemotePort,
		protocol: 17,
	}
	connInfo := network.NewConnectionFromUDPConnection(localAddr.ip, localAddr.port, remoteAddr.ip, remoteAddr.port)

	var wq waiter.Queue
	ep, err := fr.CreateEndpoint(&wq)
	if err != nil {
		return nil, fmt.Errorf("failed to create endpoint for: %s", err)
	}

	internalConn := gonet.NewUDPConn(stack, &wq, ep)

	conn := ConnWrapper{
		localAddr:  localAddr,
		remoteAddr: remoteAddr,
		conn:       internalConn,
	}

	crew.HandleSluiceRequest(connInfo, conn)
	return nil, nil
}

func (c *Connection) forward(onConnectionEnd func(*Connection)) {
	go func() {
		errc := make(chan error, 1)
		go func() {
			_, err := io.Copy(c.external, c.internal)
			errc <- err
		}()
		go func() {
			_, err := io.Copy(c.internal, c.external)
			errc <- err
		}()
		<-errc
		onConnectionEnd(c)
	}()
}

func (c *Connection) close() {
	if c == nil {
		return
	}

	if c.internal != nil {
		c.internal.Close()
	}

	if c.endpoint != nil {
		c.endpoint.Close()
	}

	if c.external != nil {
		c.external.Close()
	}
}
