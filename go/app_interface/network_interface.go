package app_interface

import (
	"net"

	"gvisor.dev/gvisor/pkg/tcpip"
	"gvisor.dev/gvisor/pkg/tcpip/network/ipv4"
	"gvisor.dev/gvisor/pkg/tcpip/network/ipv6"
)

type NetworkInterface struct {
	Name      string
	Index     int
	MTU       int
	Up        bool
	Multicast bool
	Loopback  bool
	P2P       bool
	Addresses []NetworkAddress

	Flags net.Flags
}

func (i *NetworkInterface) setFlagsValue() {
	if i.Up {
		i.Flags |= net.FlagUp
	}
	if i.Loopback {
		i.Flags |= net.FlagLoopback
	}
	if i.P2P {
		i.Flags |= net.FlagPointToPoint
	}
	if i.Multicast {
		i.Flags |= net.FlagMulticast
		i.Flags |= net.FlagBroadcast
	}
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

func (i *NetworkInterface) Addrs() ([]NetworkAddress, error) {
	return i.Addresses, nil
}
