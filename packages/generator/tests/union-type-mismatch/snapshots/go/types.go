package pachca

import (
	"encoding/json"
	"fmt"
	"sort"
)

type DetailsEmpty struct {
}

type DetailsBot struct {
	BotID     int32    `json:"bot_id"`
	WebhookID *int32   `json:"webhook_id,omitempty"`
	Scopes    []string `json:"scopes,omitempty"`
}

func (m DetailsBot) MarshalJSON() ([]byte, error) {
	type Alias DetailsBot
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.Scopes != nil {
		if raw["scopes"], err = json.Marshal(m.Scopes); err != nil {
			return nil, err
		}
	}
	return json.Marshal(raw)
}

type DetailsBotTokenUpdated struct {
	TokenKind       string        `json:"token_kind"`
	ResourceOwnerID int32         `json:"resource_owner_id"`
	AccessTokenID   int32         `json:"access_token_id"`
	CurrentScopes   []string      `json:"current_scopes,omitempty"`
	BotID           *int32        `json:"bot_id,omitempty"`
	WebhookID       *int32        `json:"webhook_id,omitempty"`
	Scopes          *ScopesChange `json:"scopes,omitempty"`
}

func (m DetailsBotTokenUpdated) MarshalJSON() ([]byte, error) {
	type Alias DetailsBotTokenUpdated
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.CurrentScopes != nil {
		if raw["current_scopes"], err = json.Marshal(m.CurrentScopes); err != nil {
			return nil, err
		}
	}
	return json.Marshal(raw)
}

type DetailsToken struct {
	TokenKind       string   `json:"token_kind"`
	ResourceOwnerID int32    `json:"resource_owner_id"`
	Scopes          []string `json:"scopes"`
	AccessTokenID   int32    `json:"access_token_id"`
	BotID           *int32   `json:"bot_id,omitempty"`
	WebhookID       *int32   `json:"webhook_id,omitempty"`
	ApplicationID   *int32   `json:"application_id,omitempty"`
	DeviceName      *string  `json:"device_name,omitempty"`
}

type ScopesChange struct {
	Previous []string `json:"previous"`
	New      []string `json:"new"`
}

type Event struct {
	ID       int32             `json:"id"`
	EventKey string            `json:"event_key"`
	Details  EventDetailsUnion `json:"details"`
}

// unionMemberShape lists the JSON keys one member of an undiscriminated union declares.
type unionMemberShape struct {
	keys map[string]struct{}
}

// rankUnionMembers orders the members by how well they fit the payload: most
// keys recognised, then fewest unrecognised, then fewest declared, a tie keeping
// the declared order. Returns nothing when the payload is not a JSON object.
func rankUnionMembers(data []byte, shapes []unionMemberShape) []int {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil
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
	return order
}

type EventDetailsUnion struct {
	DetailsEmpty           *DetailsEmpty
	DetailsBot             *DetailsBot
	DetailsBotTokenUpdated *DetailsBotTokenUpdated
	DetailsToken           *DetailsToken
	Raw                    json.RawMessage
}

var eventDetailsUnionShapes = []unionMemberShape{
	{keys: map[string]struct{}{}},
	{keys: map[string]struct{}{"bot_id": {}, "webhook_id": {}, "scopes": {}}},
	{keys: map[string]struct{}{"token_kind": {}, "resource_owner_id": {}, "current_scopes": {}, "access_token_id": {}, "bot_id": {}, "webhook_id": {}, "scopes": {}}},
	{keys: map[string]struct{}{"token_kind": {}, "resource_owner_id": {}, "scopes": {}, "access_token_id": {}, "bot_id": {}, "webhook_id": {}, "application_id": {}, "device_name": {}}},
}

// UnmarshalJSON decodes EventDetailsUnion, which carries no discriminator field:
// members are tried in the order they match the payload keys, and the first one
// that decodes wins. The raw payload is always kept in Raw, so a payload that is
// not an object is not a decode error. When no member decodes, the error is the
// one of the member that fits the keys best.
func (u *EventDetailsUnion) UnmarshalJSON(data []byte) error {
	u.Raw = append(json.RawMessage(nil), data...)
	var firstErr error
	for _, i := range rankUnionMembers(data, eventDetailsUnionShapes) {
		var err error
		switch i {
		case 0:
			v := &DetailsEmpty{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsEmpty = v
				return nil
			}
		case 1:
			v := &DetailsBot{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsBot = v
				return nil
			}
		case 2:
			v := &DetailsBotTokenUpdated{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsBotTokenUpdated = v
				return nil
			}
		case 3:
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

type GetEventsResponse struct {
	Data []Event `json:"data"`
}
