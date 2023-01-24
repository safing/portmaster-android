package app_interface

import (
	"log"
	"net"
)

type NetworkAddress struct {
	Addr         string
	PrefixLength int
	IsIPv6       bool
}

func (a *NetworkAddress) ToIPNet() *net.IPNet {
	ip := net.ParseIP(a.Addr)
	if ip == nil {
		log.Printf("failed to parse ip: %s", a.Addr)
		return nil
	}

	var mask net.IPMask
	if a.IsIPv6 {
		mask = net.CIDRMask(a.PrefixLength, net.IPv6len)
	} else {
		mask = net.CIDRMask(a.PrefixLength, net.IPv4len)
	}
	ipNet := &net.IPNet{IP: ip, Mask: mask}
	return ipNet
}

func (a *NetworkAddress) String() string {
	return a.Addr
}
