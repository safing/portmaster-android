package tunnel

import (
	"io"
	"net"
	"time"

	"github.com/safing/portmaster/network"
	"github.com/safing/spn/crew"
)

type ConnSPNForward struct {
	system io.ReadWriteCloser
	local  Addr
	remote Addr
}

func (c ConnSPNForward) Read(b []byte) (n int, err error) {
	return c.system.Read(b)
}

func (c ConnSPNForward) Write(b []byte) (n int, err error) {
	return c.system.Write(b)
}

func (c ConnSPNForward) Close() error {
	return c.system.Close()
}

func (c ConnSPNForward) LocalAddr() net.Addr {
	return c.local
}

func (c ConnSPNForward) RemoteAddr() net.Addr {
	return c.remote
}

func (c ConnSPNForward) SetDeadline(t time.Time) error {
	return nil
}

func (c ConnSPNForward) SetReadDeadline(t time.Time) error {
	return nil
}

func (c ConnSPNForward) SetWriteDeadline(t time.Time) error {
	return nil
}

func addSPNConnection(system io.ReadWriteCloser, local Addr, remote Addr) {
	conn := ConnSPNForward{
		system: system,
		local:  local,
		remote: remote,
	}
	connInfo := network.NewDefaultConnection(local.ip, local.port, remote.ip, remote.port, local.ipVersion, local.protocol)

	crew.HandleSluiceRequest(connInfo, conn)
}
