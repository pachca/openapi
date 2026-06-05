// Echo bot example demonstrating the Pachca Go SDK.
//
// Runs 8 steps that exercise the core API patterns:
// create, read, nested resource, idempotent POST, thread reply, pin, update, unpin.
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
	"time"

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

	client := pachca.NewPachcaClient(token)
	ctx := context.Background()

	// ── Step 0: GET — Fetch chat (verifies datetime deserialization) ─
	fmt.Println("0. Fetching chat...")
	chat, err := client.Chats.GetChat(ctx, int32(chatID))
	if err != nil {
		log.Fatalf("GetChat failed: %v", err)
	}
	fmt.Printf("   Chat: %s, createdAt=%v (%T), lastMessageAt=%v (%T)\n",
		chat.Name, chat.CreatedAt, chat.CreatedAt, chat.LastMessageAt, chat.LastMessageAt)

	// ── Step 1: POST — Create a message ──────────────────────────────
	fmt.Println("1. Creating message...")
	created, err := client.Messages.CreateMessage(ctx, pachca.MessageCreateRequest{
		Message: pachca.MessageCreateRequestMessage{
			EntityID: int32(chatID),
			Content:  "SDK test Go 🚀",
		},
	})
	if err != nil {
		log.Fatalf("CreateMessage failed: %v", err)
	}
	msgID := created.ID
	fmt.Printf("   Created message ID: %d\n", msgID)

	// ── Step 2: GET — Read the message back ──────────────────────────
	fmt.Println("2. Reading message...")
	msg, err := client.Messages.GetMessage(ctx, msgID)
	if err != nil {
		log.Fatalf("GetMessage failed: %v", err)
	}
	fmt.Printf("   Got message: %q\n", msg.Content)

	// ── Step 3: POST — Add a reaction (nested resource) ──────────────
	fmt.Println("3. Adding reaction...")
	_, err = client.Reactions.AddReaction(ctx, msgID, pachca.ReactionRequest{
		Code: "👀",
	})
	if err != nil {
		log.Fatalf("AddReaction failed: %v", err)
	}
	fmt.Println("   Added reaction 👀")

	// ── Step 4: POST — Create a thread (idempotent) ──────────────────
	fmt.Println("4. Creating thread...")
	thread, err := client.Threads.CreateThread(ctx, msgID)
	if err != nil {
		log.Fatalf("CreateThread failed: %v", err)
	}
	fmt.Printf("   Thread ID: %d\n", thread.ID)

	// ── Step 5: POST — Reply inside the thread ───────────────────────
	fmt.Println("5. Replying in thread...")
	entityType := pachca.MessageEntityTypeThread
	reply, err := client.Messages.CreateMessage(ctx, pachca.MessageCreateRequest{
		Message: pachca.MessageCreateRequestMessage{
			EntityType: &entityType,
			EntityID:   int32(thread.ID),
			Content:    fmt.Sprintf("Echo: %s", msg.Content),
		},
	})
	if err != nil {
		log.Fatalf("CreateMessage (thread reply) failed: %v", err)
	}
	replyID := reply.ID
	fmt.Printf("   Reply ID: %d\n", replyID)

	// ── Step 6: POST — Pin the original message ──────────────────────
	fmt.Println("6. Pinning message...")
	err = client.Messages.PinMessage(ctx, msgID)
	if err != nil {
		log.Fatalf("PinMessage failed: %v", err)
	}
	fmt.Println("   Pinned")

	// ── Step 7: PUT — Edit the reply ─────────────────────────────────
	fmt.Println("7. Updating reply...")
	content := fmt.Sprintf("%s (processed at %s)", reply.Content, time.Now().Format(time.RFC3339))
	_, err = client.Messages.UpdateMessage(ctx, replyID, pachca.MessageUpdateRequest{
		Message: pachca.MessageUpdateRequestMessage{
			Content: &content,
		},
	})
	if err != nil {
		log.Fatalf("UpdateMessage failed: %v", err)
	}
	fmt.Println("   Updated")

	// ── Step 8: DELETE — Unpin the original message ──────────────────
	fmt.Println("8. Unpinning message...")
	err = client.Messages.UnpinMessage(ctx, msgID)
	if err != nil {
		log.Fatalf("UnpinMessage failed: %v", err)
	}
	fmt.Println("   Unpinned")

	fmt.Println("\nDone! All 8 steps completed.")
}
