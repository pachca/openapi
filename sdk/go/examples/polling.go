// Webhook polling example — continuously process new webhook deliveries.
//
// Usage:
//
//	PACHCA_TOKEN=your_token go run polling.go
//	PACHCA_TOKEN=your_token go run polling.go --payloads
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

func main() {
	pollPayloadsOnly := flag.Bool("payloads", false, "poll payloads instead of full webhook events")
	flag.Parse()

	token := os.Getenv("PACHCA_TOKEN")
	if token == "" {
		log.Fatal("Set PACHCA_TOKEN environment variable")
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	client := pachca.NewPachcaClient(token)
	limit := int32(50)
	startedAt := time.Now()

	fmt.Println("Webhook polling worker started")
	fmt.Println("poll_limit=50 poll_interval=2s")
	fmt.Printf("waiting_for_events_created_after=%s\n", startedAt.Format(time.RFC3339))

	options := &pachca.PollWebhookEventsOptions{
		Limit:              &limit,
		Interval:           2 * time.Second,
		CreatedAfter:       &startedAt,
		MaxSeenDeliveryIDs: 5000,
	}

	var err error
	if *pollPayloadsOnly {
		err = client.Bots.PollWebhookPayloads(ctx, options, func(payload pachca.WebhookPayloadUnion) error {
			fmt.Printf("%+v\n", payload)
			return nil
		})
	} else {
		err = client.Bots.PollWebhookEvents(ctx, options, func(event pachca.WebhookEvent) error {
			fmt.Printf("%+v\n", event)
			return nil
		})
	}
	if err != nil && err != context.Canceled {
		log.Fatal(err)
	}
}
