package engine

import (
	"sync"

	"github.com/safing/portbase/log"
	"github.com/safing/portbase/modules"
	"github.com/safing/portmaster/netenv"
	"github.com/tevino/abool"
)

var NET_CAPABILITY_NOT_METERED int32 = 11

var (
	onNotMatternNetwrokChannel chan struct{}
	networkChangeMutex         sync.Mutex

	IsCurrentNetworkNotMetered abool.AtomicBool
)

type Network interface {
	HasCapability(int32) bool
}

func init() {
	onNotMatternNetwrokChannel = make(chan struct{})
}

func NotifiOnNotMeterdNetwork() <-chan struct{} {
	networkChangeMutex.Lock()
	defer networkChangeMutex.Unlock()
	return onNotMatternNetwrokChannel
}

// OnNetworkConnected called from java when new network interface is connected.
func OnNetworkConnected() {
	// Ignore if engine is not initialized
	if engineInitialized.IsNotSet() {
		return
	}

	log.Info("engine: network interface connected")
	go netenv.TriggerOnlineStatusInvestigation()
}

// OnNetworkConnected called from java when a network interface is disconnected.
func OnNetworkDisconnected() {
	// Ignore if engine is not initialized
	if engineInitialized.IsNotSet() {
		return
	}

	log.Info("engine: network interface disconnected")
	go netenv.TriggerOnlineStatusInvestigation()
}

// OnNetworkConnected called from java when a network interface changes some of its properties.
func OnNetworkCapabilitiesChanged(network Network) {
	// Ignore if engine is not initialized
	if engineInitialized.IsNotSet() {
		return
	}

	// Trigger online check
	go netenv.TriggerOnlineStatusInvestigation()

	networkChangeMutex.Lock()
	defer networkChangeMutex.Unlock()

	isNotMetered := network.HasCapability(NET_CAPABILITY_NOT_METERED)
	if IsCurrentNetworkNotMetered.IsSet() != isNotMetered {
		if isNotMetered {
			close(onNotMatternNetwrokChannel)
		} else {
			onNotMatternNetwrokChannel = make(chan struct{})
		}
	}
	IsCurrentNetworkNotMetered.SetTo(isNotMetered)
}

// OnIdleModeChanged is called from java when device switches from or to idle mode.
func OnIdleModeChanged(isOnIdleMode bool) {
	log.Infof("engine: device sleep mode is enabled: %t", isOnIdleMode)
	modules.SetSleepMode(isOnIdleMode)
}
