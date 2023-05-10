package ui

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/safing/portbase/api"
	"github.com/safing/portbase/log"
	"github.com/safing/portmaster-android/go/app_interface"
	"github.com/safing/portmaster-android/go/engine"
	"github.com/safing/portmaster-android/go/engine/bug_report"
	"github.com/safing/portmaster-android/go/engine/logs"
	"github.com/safing/portmaster-android/go/engine/tunnel"
)

// Functions that have PluginCall as an argument are automatically exposed to the ionic UI

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

func IsGeoIPDataAvailable() (bool, error) {
	return engine.IsGeoIPDataAvailable()
}

func PerformRequest(call PluginCall) {
	// Parameter requestJson.
	requestJson, err := call.GetString("requestJson")
	if err != nil {
		call.Error("missing requestJson argument")
		return
	}

	// Parse json request.
	var request Request
	err = json.Unmarshal([]byte(requestJson), &request)
	if err != nil {
		log.Errorf("engine: failed to parse ui request: %s %q", err, requestJson)
		call.Error(err.Error())
		return
	}

	// Handle internal requests.
	if strings.HasPrefix(request.Url, "internal:") {
		var apiRequest = &api.Request{}
		ctx := context.WithValue(context.Background(), api.RequestContextKey, apiRequest)

		apiRequest.Request, err = http.NewRequestWithContext(ctx, request.Method, request.Url, strings.NewReader(request.Body))
		if err != nil {
			log.Errorf("engine: failed to create request: %s", err)
			call.Error(err.Error())
			return
		}

		// Copy headers
		for key, values := range request.Headers {
			for _, value := range values {
				apiRequest.Request.Header.Add(key, value)
			}
		}

		// Get service id
		path := strings.TrimPrefix(apiRequest.Request.URL.Path, "/v1/")
		endpoint, err := api.GetEndpointByPath(path)
		if err != nil {
			log.Errorf("engine: %s", err)
			call.Error(err.Error())
			return
		}
		apiRequest.HandlerCache = endpoint

		// Call service
		response := NewResponseWriter()
		endpoint.ServeHTTP(response, apiRequest.Request)

		log.Debugf("engine: http service response: %q %d", endpoint.Path, response.statusCode)
		if response.statusCode < http.StatusBadRequest {
			call.ResolveJson(response.body)
		} else {
			// Error if status code is >= 400 (BadRequest)
			call.Error(response.body)
		}
		return
	}

	// External paths are not implemented yet.
	log.Errorf("Path not implemented for: %s", request.Url)
	call.Error("Path not implemented")
	return
}

func DatabaseMessage(msg string) {
	Database.Handle([]byte(msg))
}

func SubscribeToDatabase(call PluginCall) {
	call.KeepAlive(true)
	dbCall = call
	call.Resolve()
}
