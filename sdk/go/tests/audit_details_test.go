// Audit event details carry no discriminator: a record whose shape fits a member
// by its keys but not by its types decodes into the next member that fits, and
// the raw payload stays in Raw. One record never breaks the page. A record from
// before 7 October 2026 keeps scopes as an object in bot_token_updated and as a
// list in bot_token_created: AuditDetailsBot takes both.
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
	bot := details.AuditDetailsBot
	if bot == nil || bot.Scopes == nil || bot.Scopes.StringList != nil {
		t.Fatalf("an old bot_token_updated decodes into AuditDetailsBot with scopes as an object: %s", details.Raw)
	}
	change := bot.Scopes.AuditDetailsTokenScopesChange
	if change == nil || len(change.Previous) != 1 || len(change.New) != 2 || bot.AccessTokenID == nil || *bot.AccessTokenID != 4827 {
		t.Errorf("the scopes change keeps previous and new: %+v", bot.Scopes)
	}
	if !strings.Contains(string(details.Raw), `"previous":["messages:read"]`) {
		t.Errorf("Raw lost the payload: %s", details.Raw)
	}
	if page.Data[1].Details.AuditDetailsChatId == nil || page.Data[1].Details.AuditDetailsChatId.ChatID != 5 {
		t.Errorf("the next record decodes as before: %+v", page.Data[1].Details)
	}
}

// bot_token_created before 7 October 2026: scopes is a list, no token_kind.
func TestOldBotTokenCreated(t *testing.T) {
	var details pachca.AuditEventDetailsUnion
	payload := `{"actor_id":12,"bot_id":7,"webhook_id":31,"application_id":null,"access_token_id":4827,` +
		`"access_token_preview":"cH5k...x7Qp","scopes":["messages:read","chats:read"]}`
	if err := json.Unmarshal([]byte(payload), &details); err != nil {
		t.Fatalf("decode: %v", err)
	}
	bot := details.AuditDetailsBot
	if bot == nil || bot.Scopes == nil || len(bot.Scopes.StringList) != 2 || bot.Scopes.AuditDetailsTokenScopesChange != nil {
		t.Fatalf("an old bot_token_created decodes into AuditDetailsBot with scopes as a list: %s", details.Raw)
	}
	out, err := json.Marshal(bot)
	if err != nil || !strings.Contains(string(out), `"scopes":["messages:read","chats:read"]`) {
		t.Errorf("scopes goes back out as a list: %s %v", out, err)
	}
}

// A member that misses a required key gives way: encoding/json would fill it with zero.
func TestAuditDetailsSkipMemberWithoutRequiredKey(t *testing.T) {
	var details pachca.AuditEventDetailsUnion
	payload := `{"chat_id":5,"message_id":1}`
	if err := json.Unmarshal([]byte(payload), &details); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if details.AuditDetailsKms != nil {
		t.Errorf("AuditDetailsKms requires reason: it must give way, got %s", details.Raw)
	}
	if details.AuditDetailsChatId == nil || details.AuditDetailsChatId.ChatID != 5 {
		t.Errorf("AuditDetailsChatId takes the record: %+v", details)
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

// A member is checked in depth when a union picks it, as in Kotlin, Python and
// Swift: scopes {} misses previous and new of AuditDetailsTokenScopesChange, so
// AuditDetailsBot gives way, where encoding/json would fill them with nil.
func TestAuditDetailsNestedRequiredKeys(t *testing.T) {
	var details pachca.AuditEventDetailsUnion
	payload := `{"actor_id":12,"bot_id":7,"webhook_id":31,"scopes":{}}`
	if err := json.Unmarshal([]byte(payload), &details); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if details.AuditDetailsBot != nil {
		t.Errorf("scopes {} misses previous and new: AuditDetailsBot must give way, got %+v", details.AuditDetailsBot)
	}
	if details.AuditDetailsEmpty == nil || string(details.Raw) != payload {
		t.Errorf("the record goes on to the next member that fits, AuditDetailsEmpty, and Raw keeps it: %+v", details)
	}
}

// AuditDetailsBotTokenUpdated takes scopes as an object with previous and new:
// one without new gives way too.
func TestBotTokenUpdatedNestedRequiredKeys(t *testing.T) {
	var details pachca.AuditEventDetailsUnion
	payload := `{"token_kind":"bot","token_name":null,"resource_owner_id":7,"current_scopes":[],"bot_id":7,` +
		`"actor_id":12,"access_token_id":4827,"access_token_preview":null,"webhook_id":31,"scopes":{"previous":[]}}`
	if err := json.Unmarshal([]byte(payload), &details); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if details.AuditDetailsBotTokenUpdated != nil {
		t.Errorf("scopes without new: AuditDetailsBotTokenUpdated must give way, got %s", details.Raw)
	}
}

// A nested model that is not a value union is checked too: a device without
// platform does not make login_grant_approved.
func TestLoginGrantDeviceRequiredKeys(t *testing.T) {
	var details pachca.AuditEventDetailsUnion
	if err := json.Unmarshal([]byte(`{"login_grant_id":"g1","device":{"name":"iPhone"}}`), &details); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if details.AuditDetailsLoginGrantApproved != nil || details.AuditDetailsLoginGrantCreated == nil {
		t.Errorf("a device without platform gives way to AuditDetailsLoginGrantCreated: %+v", details)
	}
	details = pachca.AuditEventDetailsUnion{}
	if err := json.Unmarshal([]byte(`{"login_grant_id":"g1","device":{"name":"iPhone","platform":"iOS"}}`), &details); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if got := details.AuditDetailsLoginGrantApproved; got == nil || got.Device.Platform != pachca.AuditLoginGrantDevicePlatformIOS {
		t.Errorf("a full device decodes into AuditDetailsLoginGrantApproved: %s", details.Raw)
	}
}

// bot_token_updated today without a scopes change, and without a name change.
func TestBotTokenUpdatedWithoutChange(t *testing.T) {
	var details pachca.AuditEventDetailsUnion
	payload := `{"token_kind":"bot","token_name":null,"resource_owner_id":7,"current_scopes":["messages:read"],"bot_id":7,` +
		`"actor_id":null,"access_token_id":4827,"access_token_preview":null,"webhook_id":31}`
	if err := json.Unmarshal([]byte(payload), &details); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if got := details.AuditDetailsBotTokenUpdated; got == nil || got.TokenName != nil || got.ActorID != nil {
		t.Errorf("bot_token_updated decodes into AuditDetailsBotTokenUpdated: %s", details.Raw)
	}
}

// Decoding a model on its own stays as lenient as encoding/json: only a union
// that picks a member checks the keys in depth.
func TestModelOnItsOwnStaysLenient(t *testing.T) {
	var bot pachca.AuditDetailsBot
	if err := json.Unmarshal([]byte(`{"bot_id":7,"scopes":{}}`), &bot); err != nil {
		t.Fatalf("a model on its own does not check required keys: %v", err)
	}
	if bot.Scopes == nil || bot.Scopes.AuditDetailsTokenScopesChange == nil || bot.Scopes.AuditDetailsTokenScopesChange.New != nil {
		t.Errorf("scopes {} decodes into an empty change: %+v", bot.Scopes)
	}
}
