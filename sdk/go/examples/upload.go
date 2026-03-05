// File upload example demonstrating the Pachca Go SDK.
//
// Uploads a local file and sends it as a message attachment.
//
// Usage:
//
//	PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 PACHCA_FILE_PATH=./photo.png go run upload.go
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

func main() {
	token := os.Getenv("PACHCA_TOKEN")
	chatIDStr := os.Getenv("PACHCA_CHAT_ID")
	filePath := os.Getenv("PACHCA_FILE_PATH")

	if token == "" || chatIDStr == "" || filePath == "" {
		log.Fatal("Set PACHCA_TOKEN, PACHCA_CHAT_ID, and PACHCA_FILE_PATH environment variables")
	}

	chatID, err := strconv.Atoi(chatIDStr)
	if err != nil {
		log.Fatalf("Invalid PACHCA_CHAT_ID: %v", err)
	}

	filename := filepath.Base(filePath)

	client, err := pachca.NewPachcaClient("https://api.pachca.com/api/shared/v1", token)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	ctx := context.Background()

	// ── Step 1: Read the local file ─────────────────────────────────
	fmt.Printf("1. Reading file: %s\n", filePath)
	f, err := os.Open(filePath)
	if err != nil {
		log.Fatalf("Failed to open file: %v", err)
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		log.Fatalf("Failed to stat file: %v", err)
	}
	fileSize := info.Size()
	fmt.Printf("   Size: %d bytes\n", fileSize)

	// ── Step 2: Get upload params ───────────────────────────────────
	fmt.Println("2. Getting upload params...")
	params, err := client.Uploads.GetUploadParams(ctx)
	if err != nil {
		log.Fatalf("GetUploadParams failed: %v", err)
	}
	fmt.Printf("   Got direct_url: %s\n", params.DirectURL)

	// ── Step 3: Upload the file to S3 ──────────────────────────────
	fmt.Println("3. Uploading file...")
	err = client.Uploads.UploadFile(ctx, params, f, filename)
	if err != nil {
		log.Fatalf("UploadFile failed: %v", err)
	}
	key := strings.Replace(params.Key, "${filename}", filename, 1)
	fmt.Printf("   Uploaded, key: %s\n", key)

	// ── Step 4: Send message with the file attached ─────────────────
	fmt.Println("4. Sending message with attachment...")
	created, err := client.Messages.CreateMessage(ctx, &pachca.MessageCreateRequest{
		Message: pachca.MessageCreateRequestMessage{
			EntityType: pachca.NewOptMessageEntityType(pachca.MessageEntityTypeDiscussion),
			EntityID:   int32(chatID),
			Content:    fmt.Sprintf("File upload test: %s 🚀", filename),
			Files: []pachca.MessageCreateRequestMessageFilesItem{
				{
					Key:      key,
					Name:     filename,
					FileType: pachca.FileTypeFile,
					Size:     int32(fileSize),
				},
			},
		},
	})
	if err != nil {
		log.Fatalf("CreateMessage failed: %v", err)
	}
	fmt.Printf("   Message ID: %d\n", created.Data.ID)

	fmt.Println("\nDone! File uploaded and sent.")
}
