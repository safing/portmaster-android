package connection

import (
	"fmt"
	"net"

	"github.com/safing/portmaster/network/packet"
)

// Implements net.Addr
type Addr struct {
	ip        net.IP
	port      uint16
	ipVersion packet.IPVersion
	protocol  packet.IPProtocol
}

func (a Addr) Network() string {
	if a.protocol == packet.TCP {
		return "tcp"
	}
	if a.protocol == packet.UDP {
		return "udp"
	}

	return ""
}

func (a Addr) String() string {
	return fmt.Sprintf("%s:%d", a.ip, a.port)
}
