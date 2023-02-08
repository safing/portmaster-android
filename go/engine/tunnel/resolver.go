package tunnel

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/miekg/dns"
)

var httpClient *http.Client

func InitializeResolver() {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
			ServerName: "dns.quad9.net",
		},
		IdleConnTimeout: 3 * time.Minute,
	}

	httpClient = &http.Client{Transport: tr}
}

func ResolveQuery(msg []byte) ([]byte, error) {
	dnsQuery := new(dns.Msg)
	dnsQuery.Unpack(msg)

	// Pack query and convert to base64 string
	buf, err := dnsQuery.Pack()
	if err != nil {
		return nil, err
	}
	b64dns := base64.RawURLEncoding.EncodeToString(buf)

	// Build and execute http request
	url := &url.URL{
		Scheme:     "https",
		Host:       "9.9.9.9",
		Path:       "/dns-query",
		ForceQuery: true,
		RawQuery:   fmt.Sprintf("dns=%s", b64dns),
	}

	request, err := http.NewRequest(http.MethodGet, url.String(), nil)
	if err != nil {
		return nil, err
	}

	resp, err := httpClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("http request failed with %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}
