package pachca

type Task struct {
	ID     int32  `json:"id"`
	Title  string `json:"title"`
	IsDone *bool  `json:"is_done,omitempty"`
}

type TaskUpdateRequestTask struct {
	Title  *string `json:"title,omitempty"`
	IsDone *bool   `json:"is_done,omitempty"`
}

type TaskUpdateRequest struct {
	Task TaskUpdateRequestTask `json:"task"`
}
