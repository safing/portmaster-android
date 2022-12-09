package tunnel

import (
	"log"

	"github.com/safing/portbase/database"
	"github.com/safing/portbase/dataroot"
	"github.com/safing/portbase/run"
)

type Utils interface {
	GetAppDataDir() string
}

func OnCreate(utils Utils) {
	appDir := utils.GetAppDataDir()

	err := dataroot.Initialize(appDir, 0o0755)
	if err != nil {
		log.Printf("failed to initialize dataroot: %s", err)
		return
	}

	_ = run.Run()

	// log.Printf("Current app dir: %s", appDir)
	// err := database.InitializeWithPath(appDir)
	// if err == nil {
	// 	log.Printf("Database initialized successfully")
	// } else {
	// 	log.Printf("Failed to initialize database: %s", err)
	// }
}

func OnDestroy() {
	err := database.Shutdown()
	if err != nil {
		log.Printf("failed to shutdown database: %s", err)
	}
}
