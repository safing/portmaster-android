package ui

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/safing/portbase/config"
	"github.com/safing/portbase/log"
	"github.com/safing/portmaster-android/go/app_interface"
	"github.com/safing/portmaster-android/go/engine"
	"github.com/safing/portmaster-android/go/engine/bug_report"
	"github.com/safing/portmaster-android/go/engine/logs"
	"github.com/safing/portmaster-android/go/engine/tunnel"
	"github.com/safing/spn/access"
	"github.com/safing/spn/captain"
)

// Functions that have PluginCall as an argument are automatically exposed to the ionic UI

func EnableSPN() {
	err := config.SetConfigOption("spn/enable", true)
	if err != nil {
		log.Errorf("engine: failed to enable SPN: %s", err)
	}
}

func DisableSPN() {
	err := config.SetConfigOption("spn/enable", false)
	if err != nil {
		log.Errorf("engine: failed to disable SPN: %s", err)
	}
}

func IsTunnelActive() bool {
	return tunnel.IsActive()
}

func EnableTunnel() {
	// Send request to the VPN Service, with will notify the module.
	app_interface.SendServicesCommand("keep_alive")
}

func RestartTunnel() {
	tunnel.Reconnect()
}

// GetUser ts:(UserProfile)
func GetUser() (*access.UserRecord, error) {
	return access.GetUser()
}

func Login(call PluginCall) {
	// Get credentials from plugin call.
	username, err := call.GetString("username")
	if err != nil {
		call.Error("username can't be empty")
		return
	}
	password, err := call.GetString("password")
	if err != nil {
		call.Error("password can't be empty")
		return
	}

	// Keep the request async. This will not affect the ui call.
	go func() {
		user, code, err := access.Login(username, password)
		if code != 200 {
			// Failed to login. Return the error.
			call.Error(err.Error())
		} else {
			// Login successful
			userJson, _ := json.Marshal(user)
			log.Info(string(userJson))
			call.ResolveJson(string(userJson))
		}
	}()
}

func Logout() error {
	return access.Logout(false, true)
}

// ts:(UserProfile)
func UpdateUserInfo() (*access.UserRecord, error) {
	user, _, err := access.UpdateUser()
	return user, err
}

// ts:(SPNStatus)
func GetSPNStatus() *captain.SPNStatus {
	return captain.GetSPNStatus()
}

func GetLogs(ID int64) []logs.LogLine {
	return logs.GetAllLogsAfterID(uint64(ID))
}

func GetDebugInfoFile() {
	log.Infof("engine: exporting debug info")
	debugInfo, err := logs.GetDebugInfo("github")
	if err != nil {
		return
	}
	_ = app_interface.ExportDebugInfo("PortmasterDebugInfo.txt", debugInfo)
}

func GetDebugInfo() (string, error) {
	debugInfo, err := logs.GetDebugInfo("github")
	escaped := strings.ReplaceAll(string(debugInfo), `"`, `\"`)
	return escaped, err
}

func DatabaseSubscribe(call PluginCall) {
	eventName, err := call.GetString("name")
	if err != nil {
		call.Error("Missing Name argument")
		return
	}

	query, err := call.GetString("query")
	if err != nil {
		call.Error("Missing Query argument")
		return
	}

	req := &engine.SubscribeRequest{EventName: eventName, Query: query, Call: call}
	go func() {
		engine.UISubscribeRequest(req) // this call will resolve the PluginCall
	}()
}

func CancelAllSubscriptions() {
	engine.CancelAllUISubscriptions()
}

func RemoveSubscription(eventID string) {
	engine.RemoveSubscription(eventID)
}

func Shutdown() {
	engine.OnDestroy()
}

func CreateIssue(debugInfo string, genUrl bool, issueRequestStr string) (string, error) {
	var issueRequest bug_report.IssueRequest
	err := json.Unmarshal([]byte(issueRequestStr), &issueRequest)
	if err != nil {
		return "", fmt.Errorf("failed to parse issueRequest object: %s", err)
	}

	// Upload debug info to private bin
	if debugInfo != "" {
		debugInfoUrl, err := bug_report.UploadToPrivateBin("debug-info", debugInfo)
		if err != nil {
			return "", fmt.Errorf("failed to upload debug info: %s", err)
		}
		issueRequest.DebugInfoUrl = debugInfoUrl
	}

	url, err := bug_report.CreateIssue(&issueRequest, "portmaster-android", "report-bug.md", genUrl)
	if err != nil {
		return "", fmt.Errorf("failed to create issue: %s", err)
	}
	return url, nil
}

func CreateTicket(debugInfo string, ticketRequestStr string) error {
	var ticketRequest bug_report.TicketRequest
	err := json.Unmarshal([]byte(ticketRequestStr), &ticketRequest)
	if err != nil {
		return fmt.Errorf("failed to parse ticketRequest object: %s", err)
	}

	// Upload debug info to private bin
	if debugInfo != "" {
		debugInfoUrl, err := bug_report.UploadToPrivateBin("debug-info", debugInfo)
		if err != nil {
			return fmt.Errorf("failed to upload debug info: %s", err)
		}
		ticketRequest.DebugInfoUrl = debugInfoUrl
	}

	return bug_report.CreateTicket(&ticketRequest)
}

func DownloadPendingUpdates() {
	engine.DownloadUpdates()
}

func DownloadUpdatesOnWifiConnected() {
	engine.DownloadUpdatesOnWifiConnected()
}

func SubscribeToUpdater(call PluginCall) {
	eventID, err := call.GetString("eventID")
	if err != nil {
		call.Error("ui: missing eventID argument")
		return
	}

	engine.SubscribeToUpdateListener(eventID, call)
	call.Resolve()
}

func UnsubscribeFromUpdater() {
	engine.SubscribeToUpdateListener("", nil)
}

func IsGeoIPDataAvailable() (bool, error) {
	return engine.IsGeoIPDataAvailable()
}
