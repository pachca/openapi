// Stub client example — unit-testing with dependency injection.
//
// Demonstrates NewStubPachcaClient with a custom MessagesService implementation.
//
// Usage:
//
//	go run stub.go
package main

import (
	"context"
	"fmt"
	"log"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

// fakeMessages implements pachca.MessagesService with a canned response.
type fakeMessages struct {
	pachca.MessagesServiceStub
}

func (f *fakeMessages) GetMessage(_ context.Context, _ int32) (*pachca.Message, error) {
	return &pachca.Message{
		ID:      1,
		Content: "fake message",
	}, nil
}

func main() {
	client := pachca.NewStubPachcaClient(
		pachca.WithStubMessages(&fakeMessages{}),
	)

	msg, err := client.Messages.GetMessage(context.Background(), 1)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Got: %q (id=%d)\n", msg.Content, msg.ID)
}
