package logs

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"time"

	"github.com/safing/portbase/config"
	"github.com/safing/portbase/container"
	"github.com/safing/portbase/database/record"
	"github.com/safing/portbase/formats/dsd"
	"github.com/safing/portbase/info"
	"github.com/safing/portbase/log"
	"github.com/safing/portbase/utils"
	"github.com/safing/portbase/utils/debug"
	"github.com/safing/portmaster-android/go/app_interface"
	"github.com/safing/portmaster/status"
	"github.com/safing/portmaster/updates"
	"github.com/safing/spn/captain"
)

type LogLine struct {
	Meta     string
	Content  string
	Severity string
	ID       uint64
}

// Number of lines to hold for the UI
const BufferSize = 1000

var (
	LogBuffer  []LogLine
	logsRoot   *utils.DirStructure
	logCounter uint64
	mutex      sync.RWMutex
	logFile    *os.File
	logSink    io.Writer
)

func formatDuplicates(duplicates uint64) string {
	if duplicates == 0 {
		return ""
	}
	return fmt.Sprintf(" [%dx]", duplicates+1)
}

func format(msg log.Message, duplicates uint64) (string, string) {
	file := msg.File()
	fLen := len(file)
	fPartStart := fLen - 10
	if fPartStart < 0 {
		fPartStart = 0
	}

	meta := fmt.Sprintf("%s %s:%d", msg.Time().Format("060102 15:04:05.000"), file[fPartStart:], msg.LineNumber())
	content := fmt.Sprintf("%s %s", formatDuplicates(duplicates), msg.Text())

	return meta, content
}

var logFunc log.AdapterFunc = func(msg log.Message, duplicates uint64) {
	mutex.Lock()
	defer mutex.Unlock()

	// Prepare for print.
	meta, content := format(msg, duplicates)

	// Add to LogBuffer we can see the logs in the UI.
	logCounter++
	line := LogLine{Meta: meta, Content: content, Severity: msg.Severity().Name(), ID: logCounter}
	LogBuffer = append(LogBuffer, line)

	// shrink buffer if needed
	if len(LogBuffer) > BufferSize {
		LogBuffer = LogBuffer[1:]
	}

	// Write to file and stdout if enabled
	if logSink != nil {
		_, _ = logSink.Write([]byte(fmt.Sprintf("%s -> %s %s\n", meta, msg.Severity().String(), content)))
	}
}

// InitLogs initialize logs
func InitLogs() {
	platformInfo, err := app_interface.GetPlatformInfo()
	if err != nil {
		fmt.Printf("logs: failed to get platform info: %s", err)
	}

	if platformInfo.BuildType == "debug" {
		logFile = getLogFile(info.Version(), ".log")
		logSink = io.MultiWriter(logFile, os.Stdout)
	}
}

// FinalizeLog finalize logs
func FinalizeLog() {
	finalizeLogFile(logFile)
}

// Setup path to login dir
func EnsureLoggingDir(dataRoot *utils.DirStructure) error {
	// set up logs root
	logsRoot = dataRoot.ChildDir("logs", 0o0777)
	err := logsRoot.Ensure()
	if err != nil {
		return fmt.Errorf("failed to initialize logs root (%q): %w", logsRoot.Path, err)
	}

	return nil
}

// GetLogFunc get log listener function
func GetLogFunc() log.AdapterFunc {
	return logFunc
}

// GetAllLogsAfterID returns all login lines after specified ID
func GetAllLogsAfterID(ID uint64) []LogLine {
	mutex.Lock()
	defer mutex.Unlock()
	if len(LogBuffer) == 0 {
		return nil
	}
	ID += 1
	firstID := LogBuffer[0].ID

	// if the requested id is behind return the whole buffer
	if ID <= firstID {
		return LogBuffer
	}
	// return all after the requested id
	logIndex := (ID - firstID)
	return LogBuffer[logIndex:]
}

func getLogFile(version string, ext string) *os.File {
	// check logging dir
	identifier := "portmaster-android"
	logFileBasePath := filepath.Join(logsRoot.Path, identifier)
	err := logsRoot.EnsureAbsPath(logFileBasePath)
	if err != nil {
		log.Errorf("failed to check/create log file folder %s: %s\n", logFileBasePath, err)
	}

	// open log file
	logFilePath := filepath.Join(logFileBasePath, fmt.Sprintf("%s%s", time.Now().UTC().Format("2006-01-02-15-04-05"), ext))
	return initializeLogFile(logFilePath, identifier, version)
}

func initializeLogFile(logFilePath string, identifier string, version string) *os.File {
	logFile, err := os.OpenFile(logFilePath, os.O_RDWR|os.O_CREATE, 0o0440)
	if err != nil {
		log.Errorf("failed to create log file %s: %s\n", logFilePath, err)
		return nil
	}

	// create header, so that the portmaster can view log files as a database
	meta := record.Meta{}
	meta.Update()
	meta.SetAbsoluteExpiry(time.Now().Add(720 * time.Hour).Unix()) // one month

	// manually marshal
	// version
	c := container.New([]byte{1})
	// meta
	metaSection, err := dsd.Dump(meta, dsd.JSON)
	if err != nil {
		log.Errorf("failed to serialize header for log file %s: %s\n", logFilePath, err)
		finalizeLogFile(logFile)
		return nil
	}
	c.AppendAsBlock(metaSection)
	// log file data type (string) and newline for better manual viewing
	c.Append([]byte("S\n"))
	c.Append([]byte(fmt.Sprintf("executing %s version %s on %s %s\n", identifier, version, runtime.GOOS, runtime.GOARCH)))

	_, err = logFile.Write(c.CompileData())
	if err != nil {
		log.Errorf("failed to write header for log file %s: %s\n", logFilePath, err)
		finalizeLogFile(logFile)
		return nil
	}

	return logFile
}

func finalizeLogFile(logFile *os.File) {
	// If log file is not initialized just return.
	if logFile == nil {
		return
	}

	logFilePath := logFile.Name()

	err := logFile.Close()
	if err != nil {
		log.Errorf("failed to close log file %s: %s\n", logFilePath, err)
	}

	// check file size
	stat, err := os.Stat(logFilePath)
	if err != nil {
		return
	}

	// delete if file is smaller than
	if stat.Size() >= 200 { // header + info is about 150 bytes
		return
	}

	if err := os.Remove(logFilePath); err != nil {
		log.Errorf("failed to delete empty log file %s: %s\n", logFilePath, err)
	}
}

// GetDebugInfo returns the debugging information.
func GetDebugInfo(style string) (data []byte, err error) {
	// Create debug information helper.
	di := new(debug.Info)
	di.Style = style

	// Add debug information.
	di.AddVersionInfo()
	di.AddPlatformInfo(context.Background())
	status.AddToDebugInfo(di)
	config.AddToDebugInfo(di)
	// resolver.AddToDebugInfo(di)
	captain.AddToDebugInfo(di)
	// compat.AddToDebugInfo(di)
	di.AddLastReportedModuleError()
	di.AddLastUnexpectedLogs()
	updates.AddToDebugInfo(di)
	di.AddGoroutineStack()

	// Return data.
	return di.Bytes(), nil
}
