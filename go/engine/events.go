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
	networkChangeEventChannels []chan bool
	networkChangeMutex         sync.Mutex

	IsCurrentNetworkNotMetered abool.AtomicBool
)

type Network interface {
	HasCapability(int32) bool
}

func SubscribeToNetworkChangeEvent(c chan bool) {
	networkChangeMutex.Lock()
	defer networkChangeMutex.Unlock()
	networkChangeEventChannels = append(networkChangeEventChannels, c)
}

func UnsubscribeFromNetworkChangeEvent(channelToRemove chan bool) {
	for i, c := range networkChangeEventChannels {
		if c == channelToRemove {
			networkChangeEventChannels = append(networkChangeEventChannels[:i], networkChangeEventChannels[i+1:]...)
			return
		}
	}
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
	IsCurrentNetworkNotMetered.SetTo(isNotMetered)

	for _, c := range networkChangeEventChannels {
		c <- isNotMetered
	}
}

// OnIdleModeChanged is called from java when device switches from or to idle mode.
func OnIdleModeChanged(isOnIdleMode bool) {
	log.Infof("engine: device sleep mode is enabled: %t", isOnIdleMode)
	modules.SetSleepMode(isOnIdleMode)
}
