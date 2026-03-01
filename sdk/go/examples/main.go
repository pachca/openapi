// Echo bot example demonstrating the Pachca Go SDK.
//
// Usage:
//
//	PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 go run main.go
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

func main() {
	token := os.Getenv("PACHCA_TOKEN")
	chatIDStr := os.Getenv("PACHCA_CHAT_ID")

	if token == "" || chatIDStr == "" {
		log.Fatal("Set PACHCA_TOKEN and PACHCA_CHAT_ID environment variables")
	}

	chatID, err := strconv.Atoi(chatIDStr)
	if err != nil {
		log.Fatalf("Invalid PACHCA_CHAT_ID: %v", err)
	}

	client, err := pachca.NewPachcaClient("https://api.pachca.com/api/shared/v1", token)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	ctx := context.Background()

	// POST: Create a message
	fmt.Println("Creating message...")
	created, err := client.Messages.CreateMessage(ctx, &pachca.MessageOperationsCreateMessageReq{
		Message: pachca.MessageOperationsCreateMessageReqMessage{
			EntityType: "discussion",
			EntityID:   int32(chatID),
			Content:    "Hello from ogen SDK!",
		},
	})
	if err != nil {
		log.Fatalf("CreateMessage failed: %v", err)
	}
	fmt.Printf("Created message ID: %d\n", created.Data.ID)

	// GET: Read the message back
	fmt.Println("Reading message...")
	msg, err := client.Messages.GetMessage(ctx, created.Data.ID)
	if err != nil {
		log.Fatalf("GetMessage failed: %v", err)
	}
	fmt.Printf("Got message: %s\n", msg.Data.Content)

	// POST: Add a reaction
	fmt.Println("Adding reaction...")
	_, err = client.Reactions.AddReaction(ctx, &pachca.ReactionOperationsAddReactionReq{
		MessageID: created.Data.ID,
		Code:      "👍",
	})
	if err != nil {
		log.Fatalf("AddReaction failed: %v", err)
	}
	fmt.Println("Added reaction 👍")

	// PUT: Update the message
	fmt.Println("Updating message...")
	_, err = client.Messages.UpdateMessage(ctx, created.Data.ID, &pachca.MessageOperationsUpdateMessageReq{
		Message: pachca.MessageOperationsUpdateMessageReqMessage{
			Content: "Updated from ogen SDK!",
		},
	})
	if err != nil {
		log.Fatalf("UpdateMessage failed: %v", err)
	}
	fmt.Println("Updated message")

	// DELETE: Delete the message
	fmt.Println("Deleting message...")
	err = client.Messages.DeleteMessage(ctx, created.Data.ID)
	if err != nil {
		log.Fatalf("DeleteMessage failed: %v", err)
	}
	fmt.Println("Deleted message")

	fmt.Println("Done!")
}
