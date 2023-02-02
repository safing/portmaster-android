package engine

import (
	_ "github.com/safing/portbase/database/storage/bbolt"
	"github.com/safing/portbase/dataroot"
	"github.com/safing/portbase/info"
	"github.com/safing/portbase/log"
	"github.com/safing/portbase/modules"
	_ "github.com/safing/portbase/rng"
	"github.com/safing/portbase/run"
	"github.com/safing/portbase/utils"
	"github.com/tevino/abool"

	"github.com/safing/portmaster-android/go/app_interface"
	"github.com/safing/portmaster-android/go/engine/logs"
	_ "github.com/safing/portmaster/network"
	_ "github.com/safing/spn/captain"
	"github.com/safing/spn/conf"
	"github.com/safing/spn/sluice"
)

var (
	dataDir  string
	dataRoot *utils.DirStructure

	engineInitialized abool.AtomicBool
)

func OnCreate(appDir string) {
	// Check if engine is already initialized.
	if engineInitialized.IsSet() {
		return
	}

	engineInitialized.Set()

	info.Set("PortmasterAndroid", "0.0.1", "AGPLv3", true)
	log.SetAdapter(logs.GetLogFunc())

	log.Info("engine: initializing...")
	log.Infof("%s %s %s", info.GetInfo().Name, info.Version(), info.GetInfo().BuildDate)

	// Get application data dir. Were the application has access to write and read.
	var err error
	dataDir = appDir

	// Enable SPN client.
	conf.EnableClient(true)
	// Disable SPN listeners.
	sluice.EnableListener = false

	// Initialize database.
	err = dataroot.Initialize(dataDir, 0o0755)
	if err != nil {
		log.Errorf("engine: failed to initialize dataroot: %s", err)
		return
	}
	dataRoot = dataroot.Root()
	err = logs.EnsureLoggingDir(dataRoot)
	if err != nil {
		log.Errorf("engine: %s", err)
	}

	logs.InitLogs()

	// Run the spn service and all the dependencies.
	go func() {
		_ = run.Run()
	}()
}

func OnDestroy() {
	err := modules.Shutdown()
	if err != nil {
		log.Errorf("failed to shutdown database: %s", err)
	}
	logs.FinalizeLog()
}

func SetOSFunctions(functions app_interface.AppInterface) {
	app_interface.SetOSFunctions(functions)
}

func SetActivityFunctions(functions app_interface.AppInterface) {
	app_interface.SetActivityFunctions(functions)
}

func OnActivityDestroy() {
	app_interface.RemoveActivityFunctionReference()
	if !app_interface.HasServiceFunctions() {
		OnDestroy()
	}
}

func SetServiceFunctions(functions app_interface.AppInterface) {
	app_interface.SetServiceFunctions(functions)
}

func OnServiceDestroy() {
	app_interface.RemoveServiceFunctionReference()
	if !app_interface.HasActivityFunctions() {
		OnDestroy()
	}
}
