package pachca

import (
	"encoding/json"
	"fmt"
)

type TextContent struct {
	Kind string `json:"kind"` // always "text"
	Text string `json:"text"`
}

type ImageContent struct {
	Kind    string  `json:"kind"` // always "image"
	URL     string  `json:"url"`
	Caption *string `json:"caption,omitempty"`
}

type VideoContent struct {
	Kind     string `json:"kind"` // always "video"
	URL      string `json:"url"`
	Duration *int32 `json:"duration,omitempty"`
}

type ContentBlock struct {
	TextContent  *TextContent
	ImageContent *ImageContent
	VideoContent *VideoContent
}

func (u *ContentBlock) UnmarshalJSON(data []byte) error {
	var disc struct {
		Kind string `json:"kind"`
	}
	if err := json.Unmarshal(data, &disc); err != nil {
		return err
	}
	switch disc.Kind {
	case "text":
		u.TextContent = &TextContent{}
		return json.Unmarshal(data, u.TextContent)
	case "image":
		u.ImageContent = &ImageContent{}
		return json.Unmarshal(data, u.ImageContent)
	case "video":
		u.VideoContent = &VideoContent{}
		return json.Unmarshal(data, u.VideoContent)
	default:
		return fmt.Errorf("unknown ContentBlock kind: %s", disc.Kind)
	}
}

func (u ContentBlock) MarshalJSON() ([]byte, error) {
	if u.TextContent != nil {
		return json.Marshal(u.TextContent)
	}
	if u.ImageContent != nil {
		return json.Marshal(u.ImageContent)
	}
	if u.VideoContent != nil {
		return json.Marshal(u.VideoContent)
	}
	return nil, fmt.Errorf("empty ContentBlock")
}
