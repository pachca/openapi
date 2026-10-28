// Open enums: a value the SDK does not list yet decodes and keeps the raw string —
// in a response, in the OAuth error body and in the API error body. The client
// talks to a local server that answers each request with the next canned response.
package tests

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

const tokenInfo = `{"data":{"id":4827,"token":"cH5kR9mN...x7Qp","name":null,"user_id":12,` +
	`"scopes":["messages:read","brand_new:scope"],"created_at":"2025-01-15T10:30:00.000Z",` +
	`"revoked_at":null,"expires_in":null,"last_used_at":null}}`

type canned struct {
	status int
	body   string
}

func cannedServer(t *testing.T, responses []canned) *pachca.PachcaClient {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		next := responses[0]
		responses = responses[1:]
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(next.status)
		_, _ = w.Write([]byte(next.body))
	}))
	t.Cleanup(server.Close)
	return pachca.NewPachcaClient("test-token", pachca.WithBaseURL(server.URL))
}

func TestOpenEnums(t *testing.T) {
	ctx := context.Background()
	client := cannedServer(t, []canned{
		{200, tokenInfo},
		{401, `{"error":"brand_new_401","error_description":"A code this SDK does not list"}`},
		{403, `{"error":"brand_new_403","error_description":"A code this SDK does not list"}`},
		{422, `{"errors":[{"key":"system","value":null,"message":"A code this SDK does not list","code":"brand_new_code","payload":null}]}`},
		{401, `<html>Unauthorized</html>`},
	})

	info, err := client.Oauth.GetTokenInfo(ctx)
	if err != nil {
		t.Fatalf("token info: %v", err)
	}
	if info.Scopes[0] != pachca.OAuthScopeMessagesRead {
		t.Errorf("a listed scope decodes to its constant, got %q", info.Scopes[0])
	}
	if info.Scopes[1] != pachca.OAuthScope("brand_new:scope") {
		t.Errorf("an unlisted scope keeps its value, got %q", info.Scopes[1])
	}

	for _, code := range []pachca.OAuthErrorCode{"brand_new_401", "brand_new_403"} {
		_, err := client.Oauth.GetTokenInfo(ctx)
		var oauthErr *pachca.OAuthError
		if !errors.As(err, &oauthErr) {
			t.Fatalf("expected OAuthError with %s, got %v", code, err)
		}
		if oauthErr.Err != code || oauthErr.Error() != string(code) {
			t.Errorf("OAuthError keeps the unlisted code %s, got %q", code, oauthErr.Err)
		}
	}

	_, err = client.Oauth.GetTokenInfo(ctx)
	var apiErr *pachca.ApiError
	if !errors.As(err, &apiErr) {
		t.Fatalf("expected ApiError with brand_new_code, got %v", err)
	}
	if apiErr.Errors[0].Code != pachca.ValidationErrorCode("brand_new_code") {
		t.Errorf("ApiError keeps the unlisted code, got %q", apiErr.Errors[0].Code)
	}

	// A 401 body that does not decode is no OAuth error: it is an ApiError with the status code.
	_, err = client.Oauth.GetTokenInfo(ctx)
	var notOAuth *pachca.OAuthError
	var unauthorized *pachca.ApiError
	if errors.As(err, &notOAuth) || !errors.As(err, &unauthorized) || unauthorized.StatusCode != http.StatusUnauthorized {
		t.Errorf("an undecodable 401 comes back as an ApiError with 401, got %v", err)
	}
}
