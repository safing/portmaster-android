package tunnel

import (
	"log"

	"github.com/safing/portbase/config"
	"github.com/safing/portbase/database"
	_ "github.com/safing/portbase/database/storage/bbolt"
	"github.com/safing/portbase/dataroot"
	"github.com/safing/portbase/info"
	_ "github.com/safing/portbase/rng"
	"github.com/safing/portbase/run"

	"github.com/safing/portmaster-android/go/app_interface"
	_ "github.com/safing/portmaster/network"
	_ "github.com/safing/spn/captain"
	"github.com/safing/spn/conf"
)

func OnCreate(inter app_interface.AppInterface) {
	app_interface.Init(inter)
	appDir, err := app_interface.GetAppDataDir()
	if err != nil {
		log.Printf("failed to get application dir: %s", err)
	}
	conf.EnableClient(true)
	info.Set("PortmasterAndroid", "0.0.1", "AGPLv3", true)
	err = config.SetConfigOption("spn/enable", true)
	if err != nil {
		log.Printf("portmaster/android: failed to enable the SPN during login: %s", err)
	}

	log.Printf("Go OnCreate")
	err = dataroot.Initialize(appDir, 0o0755)
	if err != nil {
		log.Printf("failed to initialize dataroot: %s", err)
		return
	}

	go func() {
		_ = run.Run()
	}()
}

func OnDestroy() {
	err := database.Shutdown()
	if err != nil {
		log.Printf("failed to shutdown database: %s", err)
	}
}
