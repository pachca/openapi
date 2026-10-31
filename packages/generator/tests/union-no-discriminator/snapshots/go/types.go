package pachca

import (
	"encoding/json"
	"fmt"
	"sort"
)

type DetailsEmpty struct {
}

type DetailsChat struct {
	ChatID int32 `json:"chat_id"`
}

type DetailsCall struct {
	ChatID        int32  `json:"chat_id"`
	Duration      int32  `json:"duration"`
	RecordingSize *int64 `json:"recording_size,omitempty"`
}

type DetailsRename struct {
	OldName string `json:"old_name"`
	NewName string `json:"new_name"`
}

type Event struct {
	ID       int32             `json:"id"`
	EventKey string            `json:"event_key"`
	Details  EventDetailsUnion `json:"details"`
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
	"DetailsChat":   {keys: []string{"chat_id"}},
	"DetailsCall":   {keys: []string{"chat_id", "duration"}},
	"DetailsRename": {keys: []string{"old_name", "new_name"}},
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
	DetailsEmpty  *DetailsEmpty
	DetailsChat   *DetailsChat
	DetailsCall   *DetailsCall
	DetailsRename *DetailsRename
	Raw           json.RawMessage
}

var eventDetailsUnionShapes = []unionMemberShape{
	{name: "DetailsEmpty", keys: map[string]struct{}{}},
	{name: "DetailsChat", keys: map[string]struct{}{"chat_id": {}}},
	{name: "DetailsCall", keys: map[string]struct{}{"chat_id": {}, "duration": {}, "recording_size": {}}},
	{name: "DetailsRename", keys: map[string]struct{}{"old_name": {}, "new_name": {}}},
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
			v := &DetailsChat{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsChat = v
				return nil
			}
		case i == 2:
			v := &DetailsCall{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsCall = v
				return nil
			}
		case i == 3:
			v := &DetailsRename{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsRename = v
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
	if u.DetailsChat != nil {
		return json.Marshal(u.DetailsChat)
	}
	if u.DetailsCall != nil {
		return json.Marshal(u.DetailsCall)
	}
	if u.DetailsRename != nil {
		return json.Marshal(u.DetailsRename)
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

type GetEventsResponse struct {
	Data []Event `json:"data"`
}
