package tunnel

import (
	"github.com/safing/portbase/config"
	"github.com/safing/portbase/database"
	_ "github.com/safing/portbase/database/storage/bbolt"
	"github.com/safing/portbase/dataroot"
	"github.com/safing/portbase/info"
	"github.com/safing/portbase/log"
	_ "github.com/safing/portbase/rng"
	"github.com/safing/portbase/run"
	"github.com/safing/portbase/utils"

	"github.com/safing/portmaster-android/go/app_interface"
	"github.com/safing/portmaster-android/go/tunnel/logs"
	_ "github.com/safing/portmaster/network"
	_ "github.com/safing/spn/captain"
	"github.com/safing/spn/conf"
)

var (
	dataDir  string
	dataRoot *utils.DirStructure
)

func OnCreate(inter app_interface.AppInterface) {
	app_interface.Init(inter)
	info.Set("PortmasterAndroid", "0.0.1", "AGPLv3", true)
	log.SetAdapter(logs.GetLogFunc())

	log.Info("portmaster/android: initializing...")
	log.Infof("%s %s %s", info.GetInfo().Name, info.Version(), info.GetInfo().BuildDate)

	// Get application data dir. Were the application has access to write and read.
	var err error
	dataDir, err = app_interface.GetAppDataDir()
	if err != nil {
		log.Errorf("portmaster/android: failed to get application dir: %s", err)
		return
	}

	// Enable SPN client.
	conf.EnableClient(true)
	err = config.SetConfigOption("spn/enable", true)
	if err != nil {
		log.Errorf("portmaster/android: failed to enable SPN: %s", err)
		return
	}

	// Initialize database.
	err = dataroot.Initialize(dataDir, 0o0755)
	if err != nil {
		log.Errorf("portmaster/android: failed to initialize dataroot: %s", err)
		return
	}
	dataRoot = dataroot.Root()
	err = logs.EnsureLoggingDir(dataRoot)
	if err != nil {
		log.Errorf("portmaster/android: %s", err)
	}

	logs.InitLogs()

	// Run the spn service and all the dependencies.
	go func() {
		_ = run.Run()
	}()
}

func OnDestroy() {
	err := database.Shutdown()
	if err != nil {
		log.Errorf("failed to shutdown database: %s", err)
	}
	logs.FinalizeLog()
}
