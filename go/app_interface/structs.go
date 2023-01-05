package app_interface

import (
	"log"
	"net"

	"gvisor.dev/gvisor/pkg/tcpip"
	"gvisor.dev/gvisor/pkg/tcpip/network/ipv4"
	"gvisor.dev/gvisor/pkg/tcpip/network/ipv6"
)

type NetworkAddress struct {
	Addr         string
	PrefixLength int
	IsIPv6       bool
}

type NetworkInterface struct {
	Name      string
	Index     int
	MTU       int
	Up        bool
	Multicast bool
	Loopback  bool
	P2P       bool
	Addresses []NetworkAddress
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

func (i *NetworkInterface) Flags() net.Flags {
	var flags net.Flags

	if i.Up {
		flags |= net.FlagUp
	}
	if i.Loopback {
		flags |= net.FlagLoopback
	}
	if i.P2P {
		flags |= net.FlagPointToPoint
	}
	if i.Multicast {
		flags |= net.FlagMulticast
		flags |= net.FlagBroadcast
	}

	return flags
}

func (i *NetworkInterface) GetProtocolAddresses() []tcpip.ProtocolAddress {
	var addresses []tcpip.ProtocolAddress
	for _, a := range i.Addresses {

		protocolAddress := tcpip.ProtocolAddress{
			AddressWithPrefix: tcpip.AddressWithPrefix{
				Address:   tcpip.Address(a.Addr),
				PrefixLen: a.PrefixLength,
			},
		}
		if a.IsIPv6 {
			protocolAddress.Protocol = ipv6.ProtocolNumber
		} else {
			protocolAddress.Protocol = ipv4.ProtocolNumber
		}
		addresses = append(addresses, protocolAddress)
	}
	return addresses
}
