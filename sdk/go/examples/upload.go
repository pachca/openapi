// File upload example demonstrating the Pachca Go SDK.
//
// Uploads a local file and sends it as a message attachment.
//
// Usage:
//
//	PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 PACHCA_FILE_PATH=./photo.png go run upload.go
package main

import (
	"bytes"
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

	client := pachca.NewPachcaClient(token)
	ctx := context.Background()

	// ── Step 1: Read the local file ─────────────────────────────────
	fmt.Printf("1. Reading file: %s\n", filePath)
	fileData, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatalf("Failed to read file: %v", err)
	}
	fileSize := len(fileData)
	fmt.Printf("   Size: %d bytes\n", fileSize)

	// ── Step 2: Get upload params ───────────────────────────────────
	fmt.Println("2. Getting upload params...")
	params, err := client.Common.GetUploadParams(ctx)
	if err != nil {
		log.Fatalf("GetUploadParams failed: %v", err)
	}
	key := strings.Replace(params.Key, "${filename}", filename, 1)
	fmt.Printf("   Got direct_url: %s\n", params.DirectURL)

	// ── Step 3: Upload the file via SDK ─────────────────────────────
	fmt.Println("3. Uploading file...")
	err = client.Common.UploadFile(ctx, params.DirectURL, pachca.FileUploadRequest{
		Content_Disposition: params.Content_Disposition,
		ACL:                params.ACL,
		Policy:             params.Policy,
		XAMZCredential:     params.XAMZCredential,
		XAMZAlgorithm:      params.XAMZAlgorithm,
		XAMZDate:           params.XAMZDate,
		XAMZSignature:      params.XAMZSignature,
		Key:                key,
		File:               bytes.NewReader(fileData),
	})
	if err != nil {
		log.Fatalf("UploadFile failed: %v", err)
	}
	fmt.Printf("   Uploaded, key: %s\n", key)

	// ── Step 4: Send message with the file attached ─────────────────
	fmt.Println("4. Sending message with attachment...")
	created, err := client.Messages.CreateMessage(ctx, pachca.MessageCreateRequest{
		Message: pachca.MessageCreateRequestMessage{
			EntityID: int32(chatID),
			Content:  fmt.Sprintf("File upload test: %s 🚀", filename),
			Files: []pachca.MessageCreateRequestFile{
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
	fmt.Printf("   Message ID: %d\n", created.ID)

	fmt.Println("\nDone! File uploaded and sent.")
}
