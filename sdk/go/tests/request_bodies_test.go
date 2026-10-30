// Request bodies: an optional field the caller left unset stays out of the body,
// a nullable one too (null switches a setting off or deletes an object), and a
// field named in NullFields goes out as null.
package tests

import (
	"encoding/json"
	"strings"
	"testing"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

func marshalKeys(t *testing.T, v any) (string, map[string]json.RawMessage) {
	t.Helper()
	data, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var keys map[string]json.RawMessage
	if err := json.Unmarshal(data, &keys); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	return string(data), keys
}

func TestUnsetOptionalFieldsStayOut(t *testing.T) {
	name := "Бот задач"
	body, keys := marshalKeys(t, pachca.BotUpdateRequest{
		Webhook: &pachca.BotUpdateRequestWebhook{Name: &name},
	})
	if _, ok := keys["oauth_client"]; ok {
		t.Errorf("BotUpdateRequest without OAuthClient sends oauth_client: %s", body)
	}
	if _, ok := keys["promo"]; ok {
		t.Errorf("BotUpdateRequest without Promo sends promo: %s", body)
	}
	if strings.Contains(body, `"kind"`) {
		t.Errorf("BotUpdateRequestWebhook without Kind sends kind: %s", body)
	}
	if body != `{"webhook":{"name":"Бот задач"}}` {
		t.Errorf("unexpected body: %s", body)
	}

	content := "Отчёт за неделю"
	body, _ = marshalKeys(t, pachca.DraftUpdateRequest{
		Draft: pachca.DraftUpdateRequestDraft{Content: &content},
	})
	if body != `{"draft":{"content":"Отчёт за неделю"}}` {
		t.Errorf("DraftUpdateRequest sends fields it was not given: %s", body)
	}
}

func TestNullFieldsSendNull(t *testing.T) {
	body, _ := marshalKeys(t, pachca.BotUpdateRequest{NullFields: []string{"OAuthClient"}})
	if body != `{"oauth_client":null}` {
		t.Errorf("OAuthClient in NullFields: %s", body)
	}

	body, _ = marshalKeys(t, pachca.BotUpdateRequest{
		Webhook: &pachca.BotUpdateRequestWebhook{NullFields: []string{"Kind"}},
	})
	if body != `{"webhook":{"kind":null}}` {
		t.Errorf("Kind in NullFields: %s", body)
	}

	body, _ = marshalKeys(t, pachca.DraftUpdateRequest{
		Draft: pachca.DraftUpdateRequestDraft{NullFields: []string{"ParentMessageID"}},
	})
	if body != `{"draft":{"parent_message_id":null}}` {
		t.Errorf("ParentMessageID in NullFields: %s", body)
	}

	if _, err := json.Marshal(pachca.BotUpdateRequest{NullFields: []string{"Promo"}}); err == nil {
		t.Error("a field the API does not take as null must be refused")
	}
}

func TestSetEmptyListGoesOut(t *testing.T) {
	body, _ := marshalKeys(t, pachca.DraftUpdateRequest{
		Draft: pachca.DraftUpdateRequestDraft{Files: []pachca.DraftFileRequest{}},
	})
	if body != `{"draft":{"files":[]}}` {
		t.Errorf("an empty Files set by the caller must go out: %s", body)
	}
}
