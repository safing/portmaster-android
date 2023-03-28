package app_interface

import (
	"fmt"
	"net"
)

type NetworkAddress struct {
	Addr         string
	PrefixLength int
	IsIPv6       bool
}

func (a *NetworkAddress) ToIPNet() (*net.IPNet, error) {
	ip := net.ParseIP(a.Addr)
	if ip == nil {
		return nil, fmt.Errorf("failed to parse ip: %s", a.Addr)
	}

	var mask net.IPMask
	if a.IsIPv6 {
		mask = net.CIDRMask(a.PrefixLength, net.IPv6len)
	} else {
		mask = net.CIDRMask(a.PrefixLength, net.IPv4len)
	}
	ipNet := &net.IPNet{IP: ip, Mask: mask}
	return ipNet, nil
}

func (a *NetworkAddress) String() string {
	return a.Addr
}
