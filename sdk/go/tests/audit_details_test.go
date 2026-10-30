// Audit event details carry no discriminator: a record whose shape fits a member
// by its keys but not by its types (an older format) decodes into the next member
// that fits, and the raw payload stays in Raw. One record never breaks the page.
package tests

import (
	"encoding/json"
	"strings"
	"testing"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

// bot_token_updated before 7 October 2026: scopes is an object, not a list.
const oldBotTokenUpdated = `{"id":"1","created_at":"2026-10-01T10:00:00.000Z","event_key":"bot_token_updated",` +
	`"entity_id":"7","entity_type":"Bot","actor_id":"12","actor_type":"User",` +
	`"details":{"actor_id":12,"bot_id":7,"webhook_id":31,"application_id":null,"access_token_id":4827,` +
	`"access_token_preview":"cH5k...x7Qp","scopes":{"previous":["messages:read"],"new":["messages:read","chats:read"]}},` +
	`"ip_address":null,"user_agent":null}`

func TestOldAuditRecordDecodes(t *testing.T) {
	var page struct {
		Data []pachca.AuditEvent `json:"data"`
	}
	payload := `{"data":[` + oldBotTokenUpdated + `,{"id":"2","created_at":"2026-10-01T10:00:00.000Z",` +
		`"event_key":"user_chat_join","entity_id":"5","entity_type":"Chat","actor_id":"12","actor_type":"User",` +
		`"details":{"chat_id":5},"ip_address":null,"user_agent":null}]}`
	if err := json.Unmarshal([]byte(payload), &page); err != nil {
		t.Fatalf("an older record breaks the page: %v", err)
	}
	if len(page.Data) != 2 {
		t.Fatalf("want 2 events, got %d", len(page.Data))
	}
	details := page.Data[0].Details
	if details.AuditDetailsBot != nil {
		t.Error("AuditDetailsBot takes scopes as a list: it must give way")
	}
	if !strings.Contains(string(details.Raw), `"previous":["messages:read"]`) {
		t.Errorf("Raw lost the payload: %s", details.Raw)
	}
	if page.Data[1].Details.AuditDetailsChatId == nil || page.Data[1].Details.AuditDetailsChatId.ChatID != 5 {
		t.Errorf("the next record decodes as before: %+v", page.Data[1].Details)
	}
}

func TestAuditDetailsKeepBestFit(t *testing.T) {
	var details pachca.AuditEventDetailsUnion
	payload := `{"bot_id":7,"actor_id":null,"webhook_id":31,"scopes":["messages:read"]}`
	if err := json.Unmarshal([]byte(payload), &details); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if details.AuditDetailsBot == nil || details.AuditDetailsBot.BotID != 7 {
		t.Errorf("a record that fits AuditDetailsBot decodes into it: %+v", details)
	}
}

// bot_token_updated today: current_scopes plus scopes as an object when the
// request changed them. AuditDetailsBotTokenUpdated still fits it best.
func TestBotTokenUpdatedWithScopesChange(t *testing.T) {
	var details pachca.AuditEventDetailsUnion
	payload := `{"application_id":3,"application_name":"Задачи","client_id":"abc","bot_id":7,"bot_name":"Бот задач",` +
		`"access_token_id":4827,"access_token_preview":"cH5k...x7Qp","token_name":"Отчёты","token_kind":"bot",` +
		`"resource_owner_id":7,"actor_id":12,"webhook_id":31,"current_scopes":["chats:read"],` +
		`"scopes":{"previous":["messages:read"],"new":["chats:read"]}}`
	if err := json.Unmarshal([]byte(payload), &details); err != nil {
		t.Fatalf("decode: %v", err)
	}
	got := details.AuditDetailsBotTokenUpdated
	if got == nil || got.AccessTokenID != 4827 || len(got.CurrentScopes) != 1 {
		t.Errorf("bot_token_updated with a scopes change decodes into AuditDetailsBotTokenUpdated: %s", details.Raw)
	}
}

// A token record holds scopes as a list: AuditDetailsBotTokenUpdated takes scopes
// as an object, so the record decodes into AuditDetailsToken.
func TestTokenRecordWithScopesList(t *testing.T) {
	var details pachca.AuditEventDetailsUnion
	payload := `{"token_kind":"user","token_name":"Отчёты","resource_owner_id":12,"scopes":["messages:read"],` +
		`"access_token_id":4828,"access_token_preview":"dG9r...a2Vu","actor_id":12}`
	if err := json.Unmarshal([]byte(payload), &details); err != nil {
		t.Fatalf("decode: %v", err)
	}
	got := details.AuditDetailsToken
	if got == nil || got.AccessTokenID != 4828 || len(got.Scopes) != 1 {
		t.Errorf("access_token_created decodes into AuditDetailsToken: %s", details.Raw)
	}
}
