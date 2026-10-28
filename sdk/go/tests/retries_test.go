// Retries: a 504 with the error code "timeout" is a search the server stopped
// because the query is too heavy, so the client hands it back at once with its
// body intact, while a 504 from a proxy is retried. The client talks to a local
// server that answers each request with the next canned response.
package tests

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

const searchTimeout = `{"errors":[{"key":"system","value":null,"message":"Search timed out","code":"timeout","payload":null}]}`

// countingServer answers every request with the same status and body and
// counts the requests.
func countingServer(t *testing.T, status int, body string) (*pachca.PachcaClient, *atomic.Int32) {
	t.Helper()
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		requests.Add(1)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(server.Close)
	return pachca.NewPachcaClient("test-token", pachca.WithBaseURL(server.URL)), &requests
}

func TestSearchTimeoutIsNotRetried(t *testing.T) {
	client, requests := countingServer(t, http.StatusGatewayTimeout, searchTimeout)
	query := "report"
	started := time.Now()
	_, err := client.Search.SearchMessages(context.Background(), &pachca.SearchMessagesParams{Query: &query})

	var apiErr *pachca.ApiError
	if !errors.As(err, &apiErr) {
		t.Fatalf("expected ApiError with timeout, got %v", err)
	}
	if apiErr.Errors[0].Code != pachca.ValidationErrorCodeTimeout {
		t.Errorf("the body reaches the caller, got %q", apiErr.Errors[0].Code)
	}
	if got := requests.Load(); got != 1 {
		t.Errorf("a 504 with the code timeout is not repeated, got %d requests", got)
	}
	if elapsed := time.Since(started); elapsed > 5*time.Second {
		t.Errorf("a 504 with the code timeout comes back at once, took %s", elapsed)
	}
}

// The retry after a 5xx waits about ten seconds: a call still running after
// one second, with one request made, is waiting for it.
func TestGatewayTimeoutWithoutCodeIsRetried(t *testing.T) {
	for _, body := range []string{
		`<html>Gateway Timeout</html>`,
		`{"errors":[{"code":"unavailable","message":"Try later"}]}`,
	} {
		client, requests := countingServer(t, http.StatusGatewayTimeout, body)
		done := make(chan struct{})
		go func() {
			_, _ = client.Chats.ListChats(context.Background(), nil)
			close(done)
		}()
		select {
		case <-done:
			t.Errorf("a 504 without the code timeout is retried, the call returned for %s", body)
		case <-time.After(time.Second):
		}
		if got := requests.Load(); got != 1 {
			t.Errorf("one request before the pause, got %d for %s", got, body)
		}
	}
}
