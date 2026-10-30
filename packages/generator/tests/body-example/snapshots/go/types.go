package pachca

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

type FileType string

const (
	FileTypeFile  FileType = "file"
	FileTypeImage FileType = "image"
	FileTypeVoice FileType = "voice"
)

type MessageFile struct {
	Key        string   `json:"key"`
	Name       string   `json:"name"`
	FileType   FileType `json:"file_type"`
	Width      *int32   `json:"width,omitempty"`
	Height     *int32   `json:"height,omitempty"`
	DurationMs *int32   `json:"duration_ms,omitempty"`
	Waveform   *string  `json:"waveform,omitempty"`
}

type UrlButton struct {
	Text string `json:"text"`
	URL  string `json:"url"`
}

type DataButton struct {
	Text string `json:"text"`
	Data string `json:"data"`
}

type MessageCreateRequestMessage struct {
	EntityID    int32         `json:"entity_id"`
	Content     *string       `json:"content,omitempty"`
	Files       []MessageFile `json:"files,omitempty"`
	Buttons     [][]Button    `json:"buttons,omitempty"`
	DisplayName *string       `json:"display_name,omitempty"`
}

func (m MessageCreateRequestMessage) MarshalJSON() ([]byte, error) {
	type Alias MessageCreateRequestMessage
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.Files != nil {
		if raw["files"], err = json.Marshal(m.Files); err != nil {
			return nil, err
		}
	}
	if m.Buttons != nil {
		if raw["buttons"], err = json.Marshal(m.Buttons); err != nil {
			return nil, err
		}
	}
	return json.Marshal(raw)
}

type MessageCreateRequest struct {
	Message     MessageCreateRequestMessage `json:"message"`
	LinkPreview *bool                       `json:"link_preview,omitempty"`
}

type MessageUpdateRequestMessage struct {
	Content *string       `json:"content,omitempty"`
	Files   []MessageFile `json:"files,omitempty"`
}

func (m MessageUpdateRequestMessage) MarshalJSON() ([]byte, error) {
	type Alias MessageUpdateRequestMessage
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.Files != nil {
		if raw["files"], err = json.Marshal(m.Files); err != nil {
			return nil, err
		}
	}
	return json.Marshal(raw)
}

type MessageUpdateRequest struct {
	Message MessageUpdateRequestMessage `json:"message"`
}

type Message struct {
	ID      int32  `json:"id"`
	Content string `json:"content"`
}

type ApiErrorItem struct {
	Key   *string `json:"key,omitempty"`
	Value *string `json:"value,omitempty"`
}

type ApiError struct {
	Errors     []ApiErrorItem `json:"errors,omitempty"`
	StatusCode int            `json:"-"` // HTTP status code of the answer
}

func (m ApiError) MarshalJSON() ([]byte, error) {
	type Alias ApiError
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.Errors != nil {
		if raw["errors"], err = json.Marshal(m.Errors); err != nil {
			return nil, err
		}
	}
	return json.Marshal(raw)
}

func (e *ApiError) Error() string {
	if len(e.Errors) == 0 {
		if e.StatusCode != 0 {
			return fmt.Sprintf("HTTP %d", e.StatusCode)
		}
		return "api error"
	}
	parts := make([]string, 0, len(e.Errors))
	for _, item := range e.Errors {
		parts = append(parts, fmt.Sprintf("%+v", item))
	}
	if len(parts) == 0 {
		return "api error"
	}
	return strings.Join(parts, ", ")
}

type OAuthError struct {
	Err *string `json:"error,omitempty"`
}

func (e *OAuthError) Error() string {
	if e.Err != nil {
		return *e.Err
	}
	return "oauth error"
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
	"UrlButton":  {keys: []string{"text", "url"}},
	"DataButton": {keys: []string{"text", "data"}},
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

type Button struct {
	UrlButton  *UrlButton
	DataButton *DataButton
	Raw        json.RawMessage
}

var buttonShapes = []unionMemberShape{
	{name: "UrlButton", keys: map[string]struct{}{"text": {}, "url": {}}},
	{name: "DataButton", keys: map[string]struct{}{"text": {}, "data": {}}},
}

// UnmarshalJSON decodes Button, which carries no discriminator field:
// members are tried in the order they match the payload keys, and the first one
// that decodes wins. The raw payload is always kept in Raw, so a payload that is
// not an object is not a decode error. A member that misses a required key, in
// itself or in a model nested in it, gives way to the next. When no member
// decodes, the error is the one of the member that fits the keys best.
func (u *Button) UnmarshalJSON(data []byte) error {
	u.Raw = append(json.RawMessage(nil), data...)
	var firstErr error
	order, raw := rankUnionMembers(data, buttonShapes)
	for _, i := range order {
		err := missingRequired(buttonShapes[i].name, raw)
		switch {
		case err != nil:
		case i == 0:
			v := &UrlButton{}
			if err = json.Unmarshal(data, v); err == nil {
				u.UrlButton = v
				return nil
			}
		case i == 1:
			v := &DataButton{}
			if err = json.Unmarshal(data, v); err == nil {
				u.DataButton = v
				return nil
			}
		}
		if firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

func (u Button) MarshalJSON() ([]byte, error) {
	if u.UrlButton != nil {
		return json.Marshal(u.UrlButton)
	}
	if u.DataButton != nil {
		return json.Marshal(u.DataButton)
	}
	if len(u.Raw) > 0 {
		return u.Raw, nil
	}
	return nil, fmt.Errorf("empty Button")
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
