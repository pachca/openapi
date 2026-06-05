// Webhook history example — fetch recent webhook deliveries and inspect payload variants.
//
// Usage:
//
//	PACHCA_TOKEN=your_token go run webhook_history.go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

func main() {
	token := os.Getenv("PACHCA_TOKEN")
	if token == "" {
		log.Fatal("Set PACHCA_TOKEN environment variable")
	}

	client := pachca.NewPachcaClient(token)
	limit := int32(5)
	response, err := client.Bots.GetWebhookEvents(context.Background(), &pachca.GetWebhookEventsParams{
		Limit: &limit,
	})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Fetched %d webhook events\n", len(response.Data))
	for i, event := range response.Data {
		fmt.Printf("%d. id=%s created_at=%s payload=%s\n", i+1, event.ID, event.CreatedAt.Format("2006-01-02T15:04:05Z07:00"), summarizePayload(event.Payload))
	}

	fmt.Printf("has_next=%v next_page=%q\n", boolValue(response.Meta.Paginate.HasNext), response.Meta.Paginate.NextPage)
}

func boolValue(value *bool) bool {
	return value != nil && *value
}

func summarizePayload(payload pachca.WebhookPayloadUnion) string {
	switch {
	case payload.LinkSharedWebhookPayload != nil:
		p := payload.LinkSharedWebhookPayload
		return fmt.Sprintf("link_shared message_id=%d links=%d user_id=%d", p.MessageID, len(p.Links), p.UserID)
	case payload.MessageWebhookPayload != nil:
		p := payload.MessageWebhookPayload
		return fmt.Sprintf("message event=%s id=%d chat_id=%d", p.Event, p.ID, p.ChatID)
	case payload.ReactionWebhookPayload != nil:
		p := payload.ReactionWebhookPayload
		return fmt.Sprintf("reaction event=%s message_id=%d code=%s", p.Event, p.MessageID, p.Code)
	case payload.ButtonWebhookPayload != nil:
		p := payload.ButtonWebhookPayload
		return fmt.Sprintf("button message_id=%d user_id=%d", p.MessageID, p.UserID)
	case payload.ViewSubmitWebhookPayload != nil:
		p := payload.ViewSubmitWebhookPayload
		return fmt.Sprintf("view user_id=%d fields=%d", p.UserID, len(p.Data))
	case payload.ChatMemberWebhookPayload != nil:
		p := payload.ChatMemberWebhookPayload
		return fmt.Sprintf("chat_member event=%s chat_id=%d users=%d", p.Event, p.ChatID, len(p.UserIDs))
	case payload.CompanyMemberWebhookPayload != nil:
		p := payload.CompanyMemberWebhookPayload
		return fmt.Sprintf("company_member event=%s users=%d", p.Event, len(p.UserIDs))
	default:
		return "unknown"
	}
}
