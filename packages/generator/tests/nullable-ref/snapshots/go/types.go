package pachca

type Address struct {
	City string  `json:"city"`
	Zip  *string `json:"zip,omitempty"`
}

type Person struct {
	ID          int32    `json:"id"`
	Name        string   `json:"name"`
	HomeAddress *Address `json:"home_address"`
	WorkAddress *Address `json:"work_address,omitempty"`
}
