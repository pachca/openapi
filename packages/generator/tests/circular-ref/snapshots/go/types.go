package pachca

import (
	"encoding/json"
)

type Category struct {
	ID       int32      `json:"id"`
	Name     string     `json:"name"`
	Parent   *Category  `json:"parent,omitempty"`
	Children []Category `json:"children,omitempty"`
}

func (m Category) MarshalJSON() ([]byte, error) {
	type Alias Category
	data, err := json.Marshal(Alias(m))
	if err != nil {
		return nil, err
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	if m.Children != nil {
		raw["children"] = m.Children
	}
	return json.Marshal(raw)
}

type TreeNode struct {
	Value string    `json:"value"`
	Left  *TreeNode `json:"left,omitempty"`
	Right *TreeNode `json:"right,omitempty"`
}
