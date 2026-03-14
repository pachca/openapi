package pachca

type Category struct {
	ID       int32      `json:"id"`
	Name     string     `json:"name"`
	Parent   *Category  `json:"parent,omitempty"`
	Children []Category `json:"children,omitempty"`
}

type TreeNode struct {
	Value string    `json:"value"`
	Left  *TreeNode `json:"left,omitempty"`
	Right *TreeNode `json:"right,omitempty"`
}
