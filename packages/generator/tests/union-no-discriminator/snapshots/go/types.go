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
	DetailsEmpty  *DetailsEmpty
	DetailsChat   *DetailsChat
	DetailsCall   *DetailsCall
	DetailsRename *DetailsRename
	Raw           json.RawMessage
}

var eventDetailsUnionShapes = []unionMemberShape{
	{keys: map[string]struct{}{}},
	{keys: map[string]struct{}{"chat_id": {}}},
	{keys: map[string]struct{}{"chat_id": {}, "duration": {}, "recording_size": {}}},
	{keys: map[string]struct{}{"old_name": {}, "new_name": {}}},
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
			v := &DetailsChat{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsChat = v
				return nil
			}
		case 2:
			v := &DetailsCall{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DetailsCall = v
				return nil
			}
		case 3:
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

type GetEventsResponse struct {
	Data []Event `json:"data"`
}
