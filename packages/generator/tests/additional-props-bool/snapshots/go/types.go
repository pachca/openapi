package pachca

import (
	"encoding/json"
)

type Metadata struct {
}

type Event struct {
	ID       int32          `json:"id"`
	Type     string         `json:"type"`
	Metadata map[string]any `json:"metadata,omitempty"`
}

func (m Event) MarshalJSON() ([]byte, error) {
	type Alias Event
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.Metadata != nil {
		if raw["metadata"], err = json.Marshal(m.Metadata); err != nil {
			return nil, err
		}
	}
	return json.Marshal(raw)
}
