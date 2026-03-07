package pachca

import (
	"encoding/json"
	"fmt"
)

// ViewBlockHeader represents a header block.
type ViewBlockHeader struct {
	Type string `json:"type"` // always "header"
	Text string `json:"text"`
}

// ViewBlockPlainText represents a plain text block.
type ViewBlockPlainText struct {
	Type string `json:"type"` // always "plain_text"
	Text string `json:"text"`
}

// ViewBlockImage represents an image block.
type ViewBlockImage struct {
	Type string  `json:"type"` // always "image"
	URL  string  `json:"url"`
	Alt  *string `json:"alt,omitempty"`
}

// ViewBlockUnion is a discriminated union of view blocks.
type ViewBlockUnion struct {
	Header    *ViewBlockHeader
	PlainText *ViewBlockPlainText
	Image     *ViewBlockImage
}

// NewViewBlockUnionHeader creates a ViewBlockUnion with a header variant.
func NewViewBlockUnionHeader(v ViewBlockHeader) ViewBlockUnion {
	return ViewBlockUnion{Header: &v}
}

// NewViewBlockUnionPlainText creates a ViewBlockUnion with a plain text variant.
func NewViewBlockUnionPlainText(v ViewBlockPlainText) ViewBlockUnion {
	return ViewBlockUnion{PlainText: &v}
}

// NewViewBlockUnionImage creates a ViewBlockUnion with an image variant.
func NewViewBlockUnionImage(v ViewBlockImage) ViewBlockUnion {
	return ViewBlockUnion{Image: &v}
}

// Value returns the active variant value, or nil if empty.
func (u ViewBlockUnion) Value() any {
	if u.Header != nil {
		return u.Header
	}
	if u.PlainText != nil {
		return u.PlainText
	}
	if u.Image != nil {
		return u.Image
	}
	return nil
}

// UnmarshalJSON implements json.Unmarshaler.
func (u *ViewBlockUnion) UnmarshalJSON(data []byte) error {
	var disc struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &disc); err != nil {
		return err
	}
	switch disc.Type {
	case "header":
		u.Header = &ViewBlockHeader{}
		return json.Unmarshal(data, u.Header)
	case "plain_text":
		u.PlainText = &ViewBlockPlainText{}
		return json.Unmarshal(data, u.PlainText)
	case "image":
		u.Image = &ViewBlockImage{}
		return json.Unmarshal(data, u.Image)
	default:
		return fmt.Errorf("unknown view block type: %s", disc.Type)
	}
}

// MarshalJSON implements json.Marshaler.
func (u ViewBlockUnion) MarshalJSON() ([]byte, error) {
	if u.Header != nil {
		return json.Marshal(u.Header)
	}
	if u.PlainText != nil {
		return json.Marshal(u.PlainText)
	}
	if u.Image != nil {
		return json.Marshal(u.Image)
	}
	return nil, fmt.Errorf("empty ViewBlockUnion")
}
