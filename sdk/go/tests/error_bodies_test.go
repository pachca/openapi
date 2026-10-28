// Error bodies: an error answer whose body is empty or not JSON is an ApiError
// with the status code and no errors, not a JSON parse error. The event stream
// answers 404 with no body when the event history is off, and a proxy answers
// 502 with an HTML page. The client talks to a local server that answers every
// request with one canned response.
package tests

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

func rawServer(t *testing.T, status int, contentType, body string) *pachca.PachcaClient {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		if contentType != "" {
			w.Header().Set("Content-Type", contentType)
		}
		w.WriteHeader(status)
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(server.Close)
	return pachca.NewPachcaClient("test-token", pachca.WithBaseURL(server.URL))
}

func asApiError(t *testing.T, err error, status int) *pachca.ApiError {
	t.Helper()
	var apiErr *pachca.ApiError
	if !errors.As(err, &apiErr) {
		t.Fatalf("expected ApiError with status %d, got %T: %v", status, err, err)
	}
	if apiErr.StatusCode != status {
		t.Errorf("the ApiError keeps the status code %d, got %d", status, apiErr.StatusCode)
	}
	return apiErr
}

func TestEmptyErrorBodyIsApiError(t *testing.T) {
	client := rawServer(t, http.StatusNotFound, "", "")
	_, err := client.Bots.GetWebhookEventsStream(context.Background())
	apiErr := asApiError(t, err, http.StatusNotFound)
	if len(apiErr.Errors) != 0 {
		t.Errorf("an empty body gives no errors, got %v", apiErr.Errors)
	}
	if apiErr.Error() != "HTTP 404" {
		t.Errorf("the message names the status, got %q", apiErr.Error())
	}
}

func TestProxyPageIsApiError(t *testing.T) {
	// POST is not repeated after a 5xx: one request, the page comes back at once.
	client := rawServer(t, http.StatusBadGateway, "text/html", "<html><body>502 Bad Gateway</body></html>")
	_, err := client.Bots.SelfRecreateBotToken(context.Background())
	asApiError(t, err, http.StatusBadGateway)

	client = rawServer(t, http.StatusNotFound, "text/html", "<html>Not Found</html>")
	err = client.Messages.DeleteMessage(context.Background(), 1)
	asApiError(t, err, http.StatusNotFound)
}

func TestJSONErrorKeepsErrorsAndStatus(t *testing.T) {
	body := `{"errors":[{"key":"name","value":null,"message":"Name is blank","code":"blank","payload":null}]}`
	client := rawServer(t, http.StatusUnprocessableEntity, "application/json", body)
	_, err := client.Bots.SelfRecreateBotToken(context.Background())
	apiErr := asApiError(t, err, http.StatusUnprocessableEntity)
	if len(apiErr.Errors) != 1 || apiErr.Errors[0].Message != "Name is blank" {
		t.Errorf("the errors reach the caller, got %v", apiErr.Errors)
	}
}

func TestUnauthorizedIsReadByItsBody(t *testing.T) {
	client := rawServer(t, http.StatusUnauthorized, "application/json", `{"error":"invalid_token","error_description":"Access token is missing"}`)
	_, err := client.Bots.GetWebhookEventsStream(context.Background())
	var oauthErr *pachca.OAuthError
	if !errors.As(err, &oauthErr) || oauthErr.Err != pachca.OAuthErrorCodeInvalidToken {
		t.Errorf("the OAuth form is an OAuthError, got %T: %v", err, err)
	}

	client = rawServer(t, http.StatusUnauthorized, "", "")
	_, err = client.Bots.GetWebhookEventsStream(context.Background())
	asApiError(t, err, http.StatusUnauthorized)
}
