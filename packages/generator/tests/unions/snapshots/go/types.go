package pachca

import (
	"encoding/json"
	"fmt"
)

type ViewBlockHeader struct {
	Type string `json:"type"` // always "header"
	Text string `json:"text"`
}

type ViewBlockPlainText struct {
	Type string `json:"type"` // always "plain_text"
	Text string `json:"text"`
}

type ViewBlockImage struct {
	Type string  `json:"type"` // always "image"
	URL  string  `json:"url"`
	Alt  *string `json:"alt,omitempty"`
}

type ViewBlockUnion struct {
	ViewBlockHeader    *ViewBlockHeader
	ViewBlockPlainText *ViewBlockPlainText
	ViewBlockImage     *ViewBlockImage
}

func (u *ViewBlockUnion) UnmarshalJSON(data []byte) error {
	var disc struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &disc); err != nil {
		return err
	}
	switch disc.Type {
	case "header":
		u.ViewBlockHeader = &ViewBlockHeader{}
		return json.Unmarshal(data, u.ViewBlockHeader)
	case "plain_text":
		u.ViewBlockPlainText = &ViewBlockPlainText{}
		return json.Unmarshal(data, u.ViewBlockPlainText)
	case "image":
		u.ViewBlockImage = &ViewBlockImage{}
		return json.Unmarshal(data, u.ViewBlockImage)
	default:
		return fmt.Errorf("unknown ViewBlockUnion type: %s", disc.Type)
	}
}

func (u ViewBlockUnion) MarshalJSON() ([]byte, error) {
	if u.ViewBlockHeader != nil {
		return json.Marshal(u.ViewBlockHeader)
	}
	if u.ViewBlockPlainText != nil {
		return json.Marshal(u.ViewBlockPlainText)
	}
	if u.ViewBlockImage != nil {
		return json.Marshal(u.ViewBlockImage)
	}
	return nil, fmt.Errorf("empty ViewBlockUnion")
}
