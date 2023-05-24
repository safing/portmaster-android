package ui

import (
	"fmt"
	"net/http"

	"github.com/safing/portbase/api"
	"github.com/safing/portbase/log"
	"github.com/safing/portmaster-android/go/engine"
)

type PluginCall = engine.PluginCall

var (
	Database api.DatabaseAPI
	dbCall   PluginCall = nil
)

func init() {
	Database = api.CreateDatabaseAPI(databaseSendFunction)
}

type Request = struct {
	Method  string              `json:"method"`
	Url     string              `json:"url"`
	Headers map[string][]string `json:"headers"`
	Body    string              `json:"body"`
}

type ResponseWriter struct {
	body       string
	statusCode int
	header     http.Header
}

func NewResponseWriter() *ResponseWriter {
	return &ResponseWriter{
		header: http.Header{},
	}
}

func (w *ResponseWriter) Header() http.Header {
	return w.header
}

func (w *ResponseWriter) Write(b []byte) (int, error) {
	w.body += string(b)
	return len(b), nil
}

func (w *ResponseWriter) WriteHeader(statusCode int) {
	w.statusCode = statusCode
}

func databaseSendFunction(data []byte) {
	if dbCall != nil {
		err := dbCall.Notify("db_event", fmt.Sprintf(`{"data": %q}`, string(data)))
		if err != nil {
			log.Errorf("ui: failed to notify ui for db response: %s", err)
		}
	}
}
