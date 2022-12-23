package tunnel

import (
	"log"

	"github.com/safing/portbase/database"
	_ "github.com/safing/portbase/database/storage/bbolt"
	"github.com/safing/portbase/dataroot"
	"github.com/safing/portbase/info"
	plog "github.com/safing/portbase/log"
	_ "github.com/safing/portbase/rng"
	"github.com/safing/portbase/run"

	"github.com/safing/portmaster-android/go/app_interface"
	// _ "github.com/safing/portmaster/core/base"
	// _ "github.com/safing/portmaster/intel"
	// _ "github.com/safing/portmaster/intel/geoip"
	// _ "github.com/safing/spn/cabin"
	// _ "github.com/safing/spn/captain"
	// _ "github.com/safing/spn/crew"
	// _ "github.com/safing/spn/docks"
	// _ "github.com/safing/spn/navigator"
	// _ "github.com/safing/spn/sluice"
	// _ "github.com/safing/spn/terminal"
)

func OnCreate(inter app_interface.AppInterface) {
	app_interface.Init(inter)
	appDir, err := app_interface.GetAppDataDir()
	if err != nil {
		log.Printf("failed to get application dir: %s", err)
	}

	info.Set("PortmasterAndroid", "0.0.1", "AGPLv3", true)
	plog.SetLogLevel(plog.TraceLevel)

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
