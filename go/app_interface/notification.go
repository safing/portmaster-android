package app_interface

import (
	"github.com/fxamacker/cbor/v2"
	"github.com/safing/portbase/log"
)

type Notification struct {
	ID      int32
	Title   string
	Message string
}

func ShowNotification(notification *Notification) error {
	argsBytes, err := cbor.Marshal(notification)
	if err != nil {
		return err
	}

	if HasServiceFunctions() {
		_, err = serviceFunctions.call("ShowNotification", argsBytes)
	} else if HasActivityFunctions() {
		_, err = activityFunctions.call("ShowNotification", argsBytes)
	}

	if err != nil {
		log.Warningf("app_interface: failed to show notification: %s", err)
	}
	return err
}

func CancelNotification(ID int32) error {
	argsBytes, err := cbor.Marshal(ID)
	if err != nil {
		return err
	}

	if HasServiceFunctions() {
		_, err = serviceFunctions.call("CancelNotification", argsBytes)
	} else if HasActivityFunctions() {
		_, err = activityFunctions.call("CancelNotification", argsBytes)
	}
	if err != nil {
		log.Warningf("app_interface: failed to cancel notification: %s", err)
	}
	return err
}
