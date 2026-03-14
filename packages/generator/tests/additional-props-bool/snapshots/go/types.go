package pachca

type Metadata struct {
}

type Event struct {
	ID       int32          `json:"id"`
	Type     string         `json:"type"`
	Metadata map[string]any `json:"metadata,omitempty"`
}
