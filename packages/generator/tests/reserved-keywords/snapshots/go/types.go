package pachca

type Entity struct {
	Class  string  `json:"class"`
	Type   string  `json:"type"`
	Import bool    `json:"import"`
	Return *string `json:"return,omitempty"`
	Val    *int32  `json:"val,omitempty"`
}
