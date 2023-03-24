package engine

import (
	"fmt"

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
	"github.com/safing/portmaster-android/go/engine/tunnel"
	_ "github.com/safing/portmaster/network"
	"github.com/safing/portmaster/updates"
	"github.com/safing/spn/access"
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
		fmt.Println("engine: was already initialized")
		return
	}

	engineInitialized.Set()

	platformInfo, err := app_interface.GetPlatformInfo()
	info.Set("PortmasterAndroid", platformInfo.VersionName, "AGPLv3", true)
	log.SetAdapter(logs.GetLogFunc())

	fmt.Println("engine: initializing...")
	fmt.Printf("%s %s %s\n", info.GetInfo().Name, info.Version(), info.GetInfo().BuildDate)

	// Get application data dir. Were the application has access to write and read.
	dataDir = appDir

	// Enable SPN client.
	conf.EnableClient(true)
	// Disable SPN listeners.
	sluice.EnableListener = false

	// Disables auto update for large files. Small files will still be auto downloaded. (filter lists)
	updates.DisableSoftwareAutoUpdate = true

	// Don't connect after login. GeoIP data is probably not downloaded.
	access.EnableAfterLogin = false

	// Initialize database.
	err = dataroot.Initialize(dataDir, 0o0755)
	if err != nil {
		_ = fmt.Errorf("engine: failed to initialize dataroot: %s", err)
		return
	}
	dataRoot = dataroot.Root()
	err = logs.EnsureLoggingDir(dataRoot)
	if err != nil {
		_ = fmt.Errorf("engine: %s", err)
	}

	// log.SetLogLevel(log.ErrorLevel)
	logs.InitLogs()

	// Run the spn service and all the dependencies.
	go func() {
		_ = run.Run()
	}()
}

// OnDestroy shutdown module system and calls System.exit(0)
func OnDestroy() {
	log.Info("engine: OnDestroy")

	err := app_interface.MinimizeApp()
	if err != nil {
		log.Errorf("engine: %s", err.Error())
	}

	err = modules.Shutdown()
	if err != nil {
		log.Errorf("failed to shutdown database: %s", err)
	}
	logs.FinalizeLog()
	engineInitialized.UnSet()

	// Call exit(0) form java so the jvm knows whats happening.
	err = app_interface.Shutdown()
	if err != nil {
		fmt.Printf("engine: failed to shutdown app: %s", err.Error())
	}
}

func IsEngineInitialized() bool {
	return engineInitialized.IsSet()
}

func SetOSFunctions(functions app_interface.AppInterface) {
	app_interface.SetOSFunctions(functions)
}

func SetActivityFunctions(functions app_interface.AppInterface) {
	app_interface.SetActivityFunctions(functions)
}

func OnActivityDestroy() {
	app_interface.RemoveActivityFunctionReference()
	CancelAllUISubscriptions()
	if !app_interface.HasServiceFunctions() || !tunnel.IsActive() {
		OnDestroy()
	}
}

func SetServiceFunctions(functions app_interface.AppInterface) {
	app_interface.SetServiceFunctions(functions)
}

func OnServiceDestroy() {
	app_interface.RemoveServiceFunctionReference()
	tunnel.SystemShutdown()
	if !app_interface.HasActivityFunctions() {
		OnDestroy()
	}
}
