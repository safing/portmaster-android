package ui

import (
	"encoding/json"
	"fmt"

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

func EnableSPN(call PluginCall) {
	err := config.SetConfigOption("spn/enable", true)
	if err != nil {
		log.Errorf("engine: failed to enable SPN: %s", err)
	}
	call.Resolve()
}

func DisableSPN(call PluginCall) {
	err := config.SetConfigOption("spn/enable", false)
	if err != nil {
		log.Errorf("engine: failed to disable SPN: %s", err)
	}
	call.Resolve()
}

func EnableTunnel(call PluginCall) {
	if !tunnel.IsActive() {
		tunnel.StartConnecting()
		_ = app_interface.ToggleTunnel("connect")
	}
	call.Resolve()
}

func DisableTunnel(call PluginCall) {
	if tunnel.IsActive() {
		tunnel.StartDisconnecting()
		_ = app_interface.ToggleTunnel("disconnect")
	}
	call.Resolve()
}

func RestartTunnel(call PluginCall) {
	_ = app_interface.ToggleTunnel("reconnect")
	call.Resolve()
}

func GetTunnelStatus(call PluginCall) {
	state := tunnel.GetState()
	bytes, _ := json.Marshal(state)
	call.ResolveJson(string(bytes))
}

func GetUser(call PluginCall) {
	user, err := access.GetUser()
	if err != nil {
		// Just log and return empty response. No info needed for the user.
		log.Warningf("engine: failed to get user from database: %s", err)
		call.Resolve()
	} else {
		userJson, _ := json.Marshal(user)
		log.Info(string(userJson))
		call.ResolveJson(string(userJson))
	}
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

func Logout(call PluginCall) {
	err := access.Logout(false, true)
	if err != nil {
		call.Error(err.Error())
	} else {
		call.Resolve()
	}

	// database.NewInterface()
}

func UpdateUserInfo(call PluginCall) {
	user, code, err := access.UpdateUser()
	if code != 200 {
		// Failed to login. Return the error.
		call.Error(err.Error())
	} else {
		// Login successful
		userJson, _ := json.Marshal(user)
		log.Info(string(userJson))
		call.ResolveJson(string(userJson))
	}
}

func GetSPNStatus(call PluginCall) {
	status := captain.GetSPNStatus()
	statusJson, err := json.Marshal(status)
	if err != nil {
		log.Errorf("engine: failed to get SPN status: %s", err)
		return
	}
	call.ResolveJson(string(statusJson))
}

func GetLogs(call PluginCall) {
	ID, _ := call.GetLong("ID")
	logs, _ := json.Marshal(logs.GetAllLogsAfterID(uint64(ID)))
	call.ResolveJson(fmt.Sprintf(`{"logs": %s}`, string(logs)))
}

func GetDebugInfoFile(call PluginCall) {
	defer call.Resolve()
	log.Infof("engine: exporting debug info")
	debugInfo, err := logs.GetDebugInfo("github")
	if err != nil {
		return
	}
	_ = app_interface.ExportDebugInfo("PortmasterDebugInfo.txt", debugInfo)
}

func GetDebugInfo(call PluginCall) {
	debugInfo, err := logs.GetDebugInfo("github")
	if err != nil {
		call.Error(fmt.Sprintf("failed to get debug info: %s", err))
		return
	}

	call.ResolveJson(fmt.Sprintf(`{"data": "%s"}`, string(debugInfo)))
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

func CancelAllSubscriptions(call PluginCall) {
	engine.CancelAllUISubscriptions()
	call.Resolve()
}

func RemoveSubscription(call PluginCall) {
	eventID, err := call.GetString("eventID")
	if err != nil {
		call.Error("missing eventID argument")
	}
	engine.RemoveSubscription(eventID)
}

func CreateIssue(call PluginCall) {
	debugInfo, err := call.GetString("debugInfo")
	if err != nil {
		call.Error("missing debugInfo argument")
		return
	}

	genUrl, err := call.GetBool("genUrl")
	if err != nil {
		call.Error("missing genUrl argument")
		return
	}

	issueRequestStr, err := call.GetString("issueRequest")
	if err != nil {
		call.Error("missing issueRequest argument")
		return
	}

	var issueRequest bug_report.IssueRequest
	err = json.Unmarshal([]byte(issueRequestStr), &issueRequest)
	if err != nil {
		call.Error(fmt.Sprintf("failed to parse issueRequest object: %s", err))
		return
	}

	// Upload debug info to private bin
	debugInfoUrl, err := bug_report.UploadToPrivateBin("debug-info", debugInfo)
	if err != nil {
		call.Error(fmt.Sprintf("failed to upload debug info: %s", err))
		return
	}
	issueRequest.DebugInfoUrl = debugInfoUrl

	url, err := bug_report.CreateIssue(&issueRequest, "portmaster-android", "report-bug.md", genUrl)
	if err != nil {
		call.Error(fmt.Sprintf("failed to create issue: %s", err))
		return
	}

	call.ResolveJson(fmt.Sprintf(`{"url": %q}`, url))
}

func CreateTicket(call PluginCall) {
	debugInfo, err := call.GetString("debugInfo")
	if err != nil {
		call.Error("missing debugInfo argument")
		return
	}

	ticketRequestStr, err := call.GetString("ticketRequest")
	if err != nil {
		call.Error("missing issueRequest argument")
		return
	}

	var ticketRequest bug_report.TicketRequest
	err = json.Unmarshal([]byte(ticketRequestStr), &ticketRequest)
	if err != nil {
		call.Error(fmt.Sprintf("failed to parse ticketRequest object: %s", err))
		return
	}

	// Upload debug info to private bin
	debugInfoUrl, err := bug_report.UploadToPrivateBin("debug-info", debugInfo)
	if err != nil {
		call.Error(fmt.Sprintf("failed to upload debug info: %s", err))
		return
	}
	ticketRequest.DebugInfoUrl = debugInfoUrl
	bug_report.CreateTicket(&ticketRequest)
	call.Resolve()
}
