package tunnel

import (
	"io"
	"sync"

	"gvisor.dev/gvisor/pkg/tcpip"
)

var (
	connections []*ConnDefaultForward
	connMutex   sync.RWMutex
)

type ConnDefaultForward struct {
	system   io.ReadWriteCloser
	remote   io.ReadWriteCloser
	endpoint tcpip.Endpoint
}

func addDefaultConnection(system io.ReadWriteCloser, remote io.ReadWriteCloser, endpoint tcpip.Endpoint) {
	conn := &ConnDefaultForward{
		system: system, remote: remote, endpoint: endpoint,
	}

	connMutex.Lock()
	defer connMutex.Unlock()
	connections = append(connections, conn)

	conn.forward()
}

func (c *ConnDefaultForward) forward() {
	go func() {
		errc := make(chan error, 1)
		go func() {
			_, err := io.Copy(c.remote, c.system)
			errc <- err
		}()
		go func() {
			_, err := io.Copy(c.system, c.remote)
			errc <- err
		}()
		<-errc
		onConnectionEnd(c)
	}()
}

func (c *ConnDefaultForward) close() {
	if c == nil {
		return
	}

	if c.system != nil {
		c.system.Close()
	}

	if c.endpoint != nil {
		c.endpoint.Close()
	}

	if c.remote != nil {
		c.remote.Close()
	}
}

// onConnectionEnd end connection callback
func onConnectionEnd(conn *ConnDefaultForward) {
	conn.close()

	connMutex.Lock()
	defer connMutex.Unlock()
	for i, c := range connections {
		if c == conn {
			connections = append(connections[:i], connections[i+1:]...)
			return
		}
	}
}

func endAllDefaultConnections() {
	if connections != nil {
		for _, c := range connections {
			c.close()
		}
		connections = nil
	}
}
