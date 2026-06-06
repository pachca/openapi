import Foundation
import PachcaSDK

// Webhook polling example — continuously process new webhook deliveries.
//
// Usage:
//   PACHCA_TOKEN=your_token swift run Polling
//   PACHCA_TOKEN=your_token swift run Polling --payloads

let pollPayloadsOnly = CommandLine.arguments.contains("--payloads")

guard let token = ProcessInfo.processInfo.environment["PACHCA_TOKEN"] else {
    fatalError("Set PACHCA_TOKEN environment variable")
}

let client = PachcaClient(token: token)
let startedAt = Date()

func log(_ value: Any) {
    print(value)
    fflush(stdout)
}

log("Webhook polling worker started")
log("poll_limit=50 poll_interval=2s")
log("waiting_for_events_created_after=\(ISO8601DateFormatter().string(from: startedAt))")

if pollPayloadsOnly {
    for try await payload in client.bots.pollWebhookPayloads(
        limit: 50,
        interval: 2,
        createdAfter: startedAt,
        maxSeenDeliveryIds: 5_000
    ) {
        log(payload)
    }
} else {
    for try await event in client.bots.pollWebhookEvents(
        limit: 50,
        interval: 2,
        createdAfter: startedAt,
        maxSeenDeliveryIds: 5_000
    ) {
        log(event)
    }
}
