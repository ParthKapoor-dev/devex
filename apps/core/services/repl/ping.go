package repl

import (
	"crypto/tls"
	"fmt"
	"io"
	log "packages/logging"
	"net/http"
	"time"
)

// Ping the Runner Service to check whether the container is running or initiating.
func pingRunner(url string) error {
	timeout := time.After(1 * time.Minute)
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}

	for {
		select {
		case <-timeout:
			return fmt.Errorf("timeout: no 'pong' response received from %s", url)

		case <-ticker.C:
			resp, err := client.Get(url)
			if err != nil {
				log.Warn("Ping failed", "url", url, "error", err)
				continue
			}
			body, err := io.ReadAll(resp.Body)
			resp.Body.Close()
			if err != nil {
				log.Warn("Read ping response failed", "url", url, "error", err)
				continue
			}
			if string(body) == "\"pong\"\n" {
				log.Info("Received pong from runner", "url", url)
				return nil
			} else {
				log.Warn("Received unexpected response", "url", url, "status_code", resp.StatusCode)
			}
		}
	}
}
