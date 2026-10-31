package pachca

import (
	"encoding/json"
	"fmt"
	"sort"
)

type DetailsEmpty struct {
}

type DetailsBot struct {
	BotID     int32                  `json:"bot_id"`
	ActorID   *int32                 `json:"actor_id"`
	WebhookID *int32                 `json:"webhook_id,omitempty"`
	Scopes    *DetailsBotScopesValue `json:"scopes,omitempty"`
}

type DetailsBotScopes struct {
	BotID  int32    `json:"bot_id"`
	Scopes []string `json:"scopes"`
}

type DetailsBotTokenUpdated struct {
	TokenKind       string        `json:"token_kind"`
	ResourceOwnerID int32         `json:"resource_owner_id"`
	AccessTokenID   int32         `json:"access_token_id"`
	BotID           *int32        `json:"bot_id,omitempty"`
	WebhookID       *int32        `json:"webhook_id,omitempty"`
	Scopes          *ScopesChange `json:"scopes,omitempty"`
}

type DetailsToken struct {
	TokenKind       string   `json:"token_kind"`
	ResourceOwnerID int32    `json:"resource_owner_id"`
	Scopes          []string `json:"scopes"`
	AccessTokenID   int32    `json:"access_token_id"`
}

type ScopesChange struct {
	Previous []string `json:"previous"`
	New      []string `json:"new"`
}

type Actor struct {
	ID   int32   `json:"id"`
	Name *string `json:"name,omitempty"`
}

type Event struct {
	ID       int32             `json:"id"`
	EventKey string            `json:"event_key"`
	Details  EventDetailsUnion `json:"details"`
	Actor    *EventActor       `json:"actor,omitempty"`
}

// unionMemberShape lists the JSON keys one member of an undiscriminated union
// declares.
type unionMemberShape struct {
	name string
	keys map[string]struct{}
}

// requiredShape lists the keys a model cannot do without, and the fields that
// hold a model (or a list of them) with required keys of its own. A required
// field that may hold null is not listed: its key may be missing.
type requiredShape struct {
	keys   []string
	nested []nestedRequiredShape
}

type nestedRequiredShape struct {
	key   string
	model string
}

// requiredShapes holds the members of undiscriminated unions and the models
// nested in them that have a required key, here or deeper.
var requiredShapes = map[string]requiredShape{
	"DetailsBot":             {keys: []string{"bot_id"}, nested: []nestedRequiredShape{{key: "scopes", model: "ScopesChange"}}},
	"DetailsBotScopes":       {keys: []string{"bot_id", "scopes"}},
	"DetailsBotTokenUpdated": {keys: []string{"token_kind", "resource_owner_id", "access_token_id"}, nested: []nestedRequiredShape{{key: "scopes", model: "ScopesChange"}}},
	"DetailsToken":           {keys: []string{"token_kind", "resource_owner_id", "scopes", "access_token_id"}},
	"ScopesChange":           {keys: []string{"previous", "new"}},
}

// missingRequired reports the first required key the payload of a model lacks,
// in the model or in a model nested in it: encoding/json leaves a missing field
// at its zero value, so a union member that misses one gives way to the next.
// It runs only when a union picks a member: decoding a model on its own stays as
// lenient as encoding/json.
func missingRequired(model string, raw map[string]json.RawMessage) error {
	shape := requiredShapes[model]
	for _, k := range shape.keys {
		if _, ok := raw[k]; !ok {
			return fmt.Errorf("%s requires %q", model, k)
		}
	}
	for _, n := range shape.nested {
		if v, ok := raw[n.key]; ok {
			if err := missingRequiredIn(n.model, v); err != nil {
				return err
			}
		}
	}
	return nil
}

// missingRequiredIn checks a field value: an object of the model, a list of them,
// or a value of another kind, which the decoder itself takes or refuses.
func missingRequiredIn(model string, data json.RawMessage) error {
	switch jsonValueKind(data) {
	case '{':
		var raw map[string]json.RawMessage
		if json.Unmarshal(data, &raw) == nil {
			return missingRequired(model, raw)
		}
	case '[':
		var items []json.RawMessage
		if json.Unmarshal(data, &items) == nil {
			for _, item := range items {
				if err := missingRequiredIn(model, item); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

// rankUnionMembers orders the members by how well they fit the payload: most
// keys recognised, then fewest unrecognised, then fewest declared, a tie keeping
// the declared order. Returns the payload keys too, and nothing when the payload
// is not a JSON object.
func rankUnionMembers(data []byte, shapes []unionMemberShape) ([]int, map[string]json.RawMessage) {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, nil
	}
	matched := make([]int, len(shapes))
	order := make([]int, len(shapes))
	for i, shape := range shapes {
		order[i] = i
		for k := range raw {
			if _, ok := shape.keys[k]; ok {
				matched[i]++
			}
		}
	}
	sort.SliceStable(order, func(a, b int) bool {
		x, y := order[a], order[b]
		if matched[x] != matched[y] {
			return matched[x] > matched[y]
		}
		// Same keys recognised means the same number unrecognised.
		return len(shapes[x].keys) < len(shapes[y].keys)
	})
	return order, raw
}

type EventDetailsUnion struct {
	DetailsEmpty           *DetailsEmpty
	DetailsBot             *DetailsBot
	DetailsBotScopes       *DetailsBotScopes
	DetailsBotTokenUpdated *DetailsBotTokenUpdated
	DetailsToken           *DetailsToken
	Raw                    json.RawMessage
}

var eventDetailsUnionShapes = []unionMemberShape{
	{name: "DetailsEmpty", keys: map[string]struct{}{}},
	{name: "DetailsBot", keys: map[string]struct{}{"bot_id": {}, "actor_id": {}, "webhook_id": {}, "scopes": {}}},
	{name: "DetailsBotScopes", keys: map[string]struct{}{"bot_id": {}, "scopes": {}}},
	{name: "DetailsBotTokenUpdated", keys: map[string]struct{}{"token_kind": {}, "resource_owner_id": {}, "access_token_id": {}, "bot_id": {}, "webhook_id": {}, "scopes": {}}},
	{name: "DetailsToken", keys: map[string]struct{}{"token_kind": {}, "resource_owner_id": {}, "scopes": {}, "access_token_id": {}}},
}

// UnmarshalJSON decodes EventDetailsUnion, which carries no discriminator field:
// members are tried in the order they match the payload keys, and the first one
// that decodes wins. The raw payload is always kept in Raw, so a payload that is
// not an object is not a decode error. A member that misses a required key, in
// itself or in a model nested in it, gives way to the next. When no member
// decodes, the error is the one of the member that fits the keys best.
func (u *EventDetailsUnion) UnmarshalJSON(data []byte) error {
	u.Raw = append(json.RawMessage(nil), data...)
	var firstErr error
	order, raw := rankUnionMembers(data, eventDetailsUnionShapes)
	for _, i := range order {
		err := missingRequired(eventDetailsUnionShapes[i].name, raw)
		switch {
		case err != nil:
		case i == 0:
			v := &DetailsEmpty{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsEmpty = v
				return nil
			}
		case i == 1:
			v := &DetailsBot{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsBot = v
				return nil
			}
		case i == 2:
			v := &DetailsBotScopes{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsBotScopes = v
				return nil
			}
		case i == 3:
			v := &DetailsBotTokenUpdated{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsBotTokenUpdated = v
				return nil
			}
		case i == 4:
			v := &DetailsToken{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsToken = v
				return nil
			}
		}
		if firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

func (u EventDetailsUnion) MarshalJSON() ([]byte, error) {
	if u.DetailsEmpty != nil {
		return json.Marshal(u.DetailsEmpty)
	}
	if u.DetailsBot != nil {
		return json.Marshal(u.DetailsBot)
	}
	if u.DetailsBotScopes != nil {
		return json.Marshal(u.DetailsBotScopes)
	}
	if u.DetailsBotTokenUpdated != nil {
		return json.Marshal(u.DetailsBotTokenUpdated)
	}
	if u.DetailsToken != nil {
		return json.Marshal(u.DetailsToken)
	}
	if len(u.Raw) > 0 {
		return u.Raw, nil
	}
	return nil, fmt.Errorf("empty EventDetailsUnion")
}

// jsonValueKind is the first byte of a JSON value: '[', '{', '"', 't' or 'f',
// or '-' or a digit for a number.
func jsonValueKind(data []byte) byte {
	for _, b := range data {
		if b != ' ' && b != '\t' && b != '\n' && b != '\r' {
			return b
		}
	}
	return 0
}

// DetailsBotScopesValue: Права токена у bot_token_created, изменение прав у bot_token_updated в старых записях.
// One field is set: the member of the JSON kind the value has.
type DetailsBotScopesValue struct {
	StringList   []string
	ScopesChange *ScopesChange
}

func (u *DetailsBotScopesValue) UnmarshalJSON(data []byte) error {
	if jsonValueKind(data) == 'n' {
		return nil
	}
	*u = DetailsBotScopesValue{}
	switch jsonValueKind(data) {
	case '[':
		return json.Unmarshal(data, &u.StringList)
	case '{':
		u.ScopesChange = new(ScopesChange)
		return json.Unmarshal(data, u.ScopesChange)
	}
	return fmt.Errorf("DetailsBotScopesValue takes StringList or ScopesChange, got %s", data)
}

func (u DetailsBotScopesValue) MarshalJSON() ([]byte, error) {
	if u.StringList != nil {
		return json.Marshal(u.StringList)
	}
	if u.ScopesChange != nil {
		return json.Marshal(u.ScopesChange)
	}
	return []byte("null"), nil
}

// EventActor: Автор события. Строка у системных событий.
// One field is set: the member of the JSON kind the value has.
type EventActor struct {
	String *string
	Actor  *Actor
}

func (u *EventActor) UnmarshalJSON(data []byte) error {
	if jsonValueKind(data) == 'n' {
		return nil
	}
	*u = EventActor{}
	switch jsonValueKind(data) {
	case '"':
		u.String = new(string)
		return json.Unmarshal(data, u.String)
	case '{':
		u.Actor = new(Actor)
		return json.Unmarshal(data, u.Actor)
	}
	return fmt.Errorf("EventActor takes String or Actor, got %s", data)
}

func (u EventActor) MarshalJSON() ([]byte, error) {
	if u.String != nil {
		return json.Marshal(u.String)
	}
	if u.Actor != nil {
		return json.Marshal(u.Actor)
	}
	return []byte("null"), nil
}

type GetEventsResponse struct {
	Data []Event `json:"data"`
}
