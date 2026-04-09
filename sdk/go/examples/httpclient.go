// HTTP client example — using a pre-configured http.Client with optional proxy.
//
// Demonstrates NewPachcaClientWithHTTP with custom transport.
//
// Usage:
//
//	PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 go run httpclient.go
//	HTTP_PROXY=http://proxy:8080 PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 go run httpclient.go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/url"
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

	transport := &http.Transport{}
	if proxy := os.Getenv("HTTP_PROXY"); proxy != "" {
		proxyURL, _ := url.Parse(proxy)
		transport.Proxy = http.ProxyURL(proxyURL)
	}

	client := &http.Client{
		Transport: &bearerTransport{
			token: token,
			base:  transport,
		},
	}

	pc := pachca.NewPachcaClientWithHTTP(pachca.PachcaAPIURL, client)

	chat, err := pc.Chats.GetChat(context.Background(), int32(chatID))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Chat: %s (id=%d)\n", chat.Name, chat.ID)
}

type bearerTransport struct {
	token string
	base  http.RoundTripper
}

func (t *bearerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+t.token)
	return t.base.RoundTrip(req)
}
