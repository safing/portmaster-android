package tunnel

import (
	"fmt"
	"io"
	"net"

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

func tryToConnectTCP(remote string, fr *tcp.ForwarderRequest) (*Connection, error) {
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

func tryToConnectUDP(stack *stack.Stack, remote string, fr *udp.ForwarderRequest) (*Connection, error) {
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
