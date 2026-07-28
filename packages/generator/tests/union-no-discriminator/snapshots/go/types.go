package pachca

import (
	"encoding/json"
	"fmt"
)

type DetailsEmpty struct {
}

type DetailsChat struct {
	ChatID int32 `json:"chat_id"`
}

type DetailsCall struct {
	ChatID        int32  `json:"chat_id"`
	Duration      int32  `json:"duration"`
	RecordingSize *int64 `json:"recording_size"`
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

// pickUnionMember selects the member that best fits the payload: most keys
// recognised, then fewest unrecognised, then fewest declared. Returns -1 when
// the payload is not a JSON object.
func pickUnionMember(data []byte, shapes []unionMemberShape) int {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return -1
	}
	best := -1
	bestMatched, bestUnknown, bestDeclared := 0, 0, 0
	for i, shape := range shapes {
		matched := 0
		for k := range raw {
			if _, ok := shape.keys[k]; ok {
				matched++
			}
		}
		unknown := len(raw) - matched
		declared := len(shape.keys)
		better := best == -1 ||
			matched > bestMatched ||
			(matched == bestMatched && unknown < bestUnknown) ||
			(matched == bestMatched && unknown == bestUnknown && declared < bestDeclared)
		if better {
			best, bestMatched, bestUnknown, bestDeclared = i, matched, unknown, declared
		}
	}
	return best
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
// the member is chosen by which one best matches the payload keys. The raw
// payload is always kept in Raw so an unrecognised shape is never a decode error.
func (u *EventDetailsUnion) UnmarshalJSON(data []byte) error {
	u.Raw = append(json.RawMessage(nil), data...)
	switch pickUnionMember(data, eventDetailsUnionShapes) {
	case 0:
		u.DetailsEmpty = &DetailsEmpty{}
		return json.Unmarshal(data, u.DetailsEmpty)
	case 1:
		u.DetailsChat = &DetailsChat{}
		return json.Unmarshal(data, u.DetailsChat)
	case 2:
		u.DetailsCall = &DetailsCall{}
		return json.Unmarshal(data, u.DetailsCall)
	case 3:
		u.DetailsRename = &DetailsRename{}
		return json.Unmarshal(data, u.DetailsRename)
	}
	return nil
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
