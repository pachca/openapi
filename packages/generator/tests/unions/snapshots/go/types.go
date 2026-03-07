package pachca

type ViewBlockHeader struct {
	Type string `json:"type"` // always "header"
	Text string `json:"text"`
}

type ViewBlockPlainText struct {
	Type string `json:"type"` // always "plain_text"
	Text string `json:"text"`
}

type ViewBlockImage struct {
	Type string `json:"type"` // always "image"
	URL string `json:"url"`
	Alt *string `json:"alt,omitempty"`
}

type ViewBlockUnion interface{}
