package app_interface

import "net"

type Connection struct {
	Protocol   int
	LocalIP    net.IP
	LocalPort  int
	RemoteIP   net.IP
	RemotePort int
}
