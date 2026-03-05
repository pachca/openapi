// Manual types and methods for API operations not handled by ogen.
// These operations use anyOf unions, 302 redirects, or empty responses
// that ogen's code generator cannot process.
package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

// parseAPIError attempts to parse an error response body as ApiError.
func parseAPIError(resp *http.Response) error {
	body, _ := io.ReadAll(resp.Body)

	var apiErr ApiError
	if json.Unmarshal(body, &apiErr) == nil && len(apiErr.Errors) > 0 {
		return &apiErr
	}

	return fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
}

// ── Export ──────────────────────────────────────────────────────────

// ExportRequest is the request body for POST /chats/exports.
type ExportRequest struct {
	StartAt       string  `json:"start_at"`
	EndAt         string  `json:"end_at"`
	WebhookURL    string  `json:"webhook_url"`
	ChatIDs       []int32 `json:"chat_ids,omitempty"`
	SkipChatsFile *bool   `json:"skip_chats_file,omitempty"`
}

// RequestExport initiates a chat export (POST /chats/exports).
// The server responds with 204 No Content on success. When the export is ready,
// a webhook is sent to the URL specified in the request.
// Requires the "chat_exports:write" scope and a corporation plan.
func (s *CommonService) RequestExport(ctx context.Context, request ExportRequest) error {
	body, err := json.Marshal(request)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.serverURL+"/chats/exports", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return parseAPIError(resp)
	}
	return nil
}

// ── Security ───────────────────────────────────────────────────────

// AuditEventKey represents the type of audit event.
type AuditEventKey string

const (
	AuditEventUserLogin          AuditEventKey = "user_login"
	AuditEventUserLogout         AuditEventKey = "user_logout"
	AuditEventUser2FAFail        AuditEventKey = "user_2fa_fail"
	AuditEventUser2FASuccess     AuditEventKey = "user_2fa_success"
	AuditEventUserCreated        AuditEventKey = "user_created"
	AuditEventUserDeleted        AuditEventKey = "user_deleted"
	AuditEventUserRoleChanged    AuditEventKey = "user_role_changed"
	AuditEventUserUpdated        AuditEventKey = "user_updated"
	AuditEventTagCreated         AuditEventKey = "tag_created"
	AuditEventTagDeleted         AuditEventKey = "tag_deleted"
	AuditEventUserAddedToTag     AuditEventKey = "user_added_to_tag"
	AuditEventUserRemovedFromTag AuditEventKey = "user_removed_from_tag"
	AuditEventChatCreated        AuditEventKey = "chat_created"
	AuditEventChatRenamed        AuditEventKey = "chat_renamed"
	AuditEventChatPermChanged    AuditEventKey = "chat_permission_changed"
	AuditEventUserChatJoin       AuditEventKey = "user_chat_join"
	AuditEventUserChatLeave      AuditEventKey = "user_chat_leave"
	AuditEventTagAddedToChat     AuditEventKey = "tag_added_to_chat"
	AuditEventTagRemovedFromChat AuditEventKey = "tag_removed_from_chat"
	AuditEventMessageUpdated     AuditEventKey = "message_updated"
	AuditEventMessageDeleted     AuditEventKey = "message_deleted"
	AuditEventMessageCreated     AuditEventKey = "message_created"
	AuditEventReactionCreated    AuditEventKey = "reaction_created"
	AuditEventReactionDeleted    AuditEventKey = "reaction_deleted"
	AuditEventThreadCreated      AuditEventKey = "thread_created"
	AuditEventTokenCreated       AuditEventKey = "access_token_created"
	AuditEventTokenUpdated       AuditEventKey = "access_token_updated"
	AuditEventTokenDestroyed     AuditEventKey = "access_token_destroy"
	AuditEventKMSEncrypt         AuditEventKey = "kms_encrypt"
	AuditEventKMSDecrypt         AuditEventKey = "kms_decrypt"
	AuditEventAuditAccessed      AuditEventKey = "audit_events_accessed"
	AuditEventDLPViolation       AuditEventKey = "dlp_violation_detected"
	AuditEventSearchUsersAPI     AuditEventKey = "search_users_api"
	AuditEventSearchChatsAPI     AuditEventKey = "search_chats_api"
	AuditEventSearchMessagesAPI  AuditEventKey = "search_messages_api"
)

// AuditEvent represents a single audit event from the security log.
// The Details field is raw JSON whose structure depends on EventKey.
// Use the AuditDetails* types to unmarshal it.
type AuditEvent struct {
	ID         string          `json:"id"`
	CreatedAt  string          `json:"created_at"`
	EventKey   AuditEventKey   `json:"event_key"`
	EntityID   string          `json:"entity_id"`
	EntityType string          `json:"entity_type"`
	ActorID    string          `json:"actor_id"`
	ActorType  string          `json:"actor_type"`
	Details    json.RawMessage `json:"details"`
	IPAddress  string          `json:"ip_address"`
	UserAgent  string          `json:"user_agent"`
}

// AuditDetailsUserUpdated contains details for "user_updated" events.
type AuditDetailsUserUpdated struct {
	ChangedAttrs []string `json:"changed_attrs"`
}

// AuditDetailsRoleChanged contains details for "user_role_changed" events.
type AuditDetailsRoleChanged struct {
	NewCompanyRole      string `json:"new_company_role"`
	PreviousCompanyRole string `json:"previous_company_role"`
	InitiatorID         int32  `json:"initiator_id"`
}

// AuditDetailsTagName contains details for "tag_created" and "tag_deleted" events.
type AuditDetailsTagName struct {
	Name string `json:"name"`
}

// AuditDetailsInitiator contains details for events with an initiator
// ("user_added_to_tag", "user_removed_from_tag", "user_chat_leave").
type AuditDetailsInitiator struct {
	InitiatorID int32 `json:"initiator_id"`
}

// AuditDetailsInviter contains details for "user_chat_join" events.
type AuditDetailsInviter struct {
	InviterID int32 `json:"inviter_id"`
}

// AuditDetailsChatRenamed contains details for "chat_renamed" events.
type AuditDetailsChatRenamed struct {
	OldName string `json:"old_name"`
	NewName string `json:"new_name"`
}

// AuditDetailsChatPermission contains details for "chat_permission_changed" events.
type AuditDetailsChatPermission struct {
	PublicAccess bool `json:"public_access"`
}

// AuditDetailsTagChat contains details for "tag_added_to_chat" events.
type AuditDetailsTagChat struct {
	ChatID  int32  `json:"chat_id"`
	TagName string `json:"tag_name"`
}

// AuditDetailsChatID contains details for "tag_removed_from_chat" events.
type AuditDetailsChatID struct {
	ChatID int32 `json:"chat_id"`
}

// AuditDetailsTokenScopes contains details for access token events.
type AuditDetailsTokenScopes struct {
	Scopes []string `json:"scopes"`
}

// AuditDetailsKMS contains details for "kms_encrypt" and "kms_decrypt" events.
type AuditDetailsKMS struct {
	ChatID    int32  `json:"chat_id"`
	MessageID int32  `json:"message_id"`
	Reason    string `json:"reason"`
}

// AuditDetailsDLP contains details for "dlp_violation_detected" events.
type AuditDetailsDLP struct {
	DLPRuleID         int32  `json:"dlp_rule_id"`
	DLPRuleName       string `json:"dlp_rule_name"`
	MessageID         int32  `json:"message_id"`
	ChatID            int32  `json:"chat_id"`
	UserID            int32  `json:"user_id"`
	ActionMessage     string `json:"action_message"`
	ConditionsMatched bool   `json:"conditions_matched"`
}

// AuditDetailsSearch contains details for search API events.
type AuditDetailsSearch struct {
	SearchType    string         `json:"search_type"`
	QueryPresent  bool           `json:"query_present"`
	CursorPresent bool           `json:"cursor_present"`
	Limit         int32          `json:"limit"`
	Filters       map[string]any `json:"filters"`
}

// GetAuditEventsParams contains parameters for the GetAuditEvents request.
type GetAuditEventsParams struct {
	StartTime  string         // Required. RFC3339 format.
	EndTime    string         // Required. RFC3339 format.
	EventKey   *AuditEventKey // Optional. Filter by event type.
	ActorID    *string        // Optional.
	ActorType  *string        // Optional.
	EntityID   *string        // Optional.
	EntityType *string        // Optional.
	Limit      *int32         // Optional. Max 50.
	Cursor     *string        // Optional. Pagination cursor.
}

// GetAuditEventsResponse is the response from GET /audit_events.
type GetAuditEventsResponse struct {
	Data []AuditEvent `json:"data"`
	Meta struct {
		Paginate struct {
			NextPage *string `json:"next_page"`
		} `json:"paginate"`
	} `json:"meta"`
}

// GetAuditEvents retrieves audit events from the security log (GET /audit_events).
// Requires the "audit_events:read" scope and a corporation plan.
func (s *SecurityService) GetAuditEvents(ctx context.Context, params GetAuditEventsParams) (*GetAuditEventsResponse, error) {
	u, err := url.Parse(s.serverURL + "/audit_events")
	if err != nil {
		return nil, err
	}

	q := u.Query()
	q.Set("start_time", params.StartTime)
	q.Set("end_time", params.EndTime)
	if params.EventKey != nil {
		q.Set("event_key", string(*params.EventKey))
	}
	if params.ActorID != nil {
		q.Set("actor_id", *params.ActorID)
	}
	if params.ActorType != nil {
		q.Set("actor_type", *params.ActorType)
	}
	if params.EntityID != nil {
		q.Set("entity_id", *params.EntityID)
	}
	if params.EntityType != nil {
		q.Set("entity_type", *params.EntityType)
	}
	if params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%d", *params.Limit))
	}
	if params.Cursor != nil {
		q.Set("cursor", *params.Cursor)
	}
	u.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, parseAPIError(resp)
	}

	var result GetAuditEventsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

// ── Views ──────────────────────────────────────────────────────────

// ViewBlock types for constructing interactive forms (POST /views/open).

type ViewBlockHeader struct {
	Type string `json:"type"` // "header"
	Text string `json:"text"`
}

type ViewBlockPlainText struct {
	Type string `json:"type"` // "plain_text"
	Text string `json:"text"`
}

type ViewBlockMarkdown struct {
	Type string `json:"type"` // "markdown"
	Text string `json:"text"`
}

type ViewBlockDivider struct {
	Type string `json:"type"` // "divider"
}

type ViewBlockInput struct {
	Type         string `json:"type"` // "input"
	Name         string `json:"name"`
	Label        string `json:"label"`
	Placeholder  string `json:"placeholder,omitempty"`
	Multiline    *bool  `json:"multiline,omitempty"`
	InitialValue string `json:"initial_value,omitempty"`
	MinLength    *int32 `json:"min_length,omitempty"`
	MaxLength    *int32 `json:"max_length,omitempty"`
	Required     *bool  `json:"required,omitempty"`
	Hint         string `json:"hint,omitempty"`
}

type ViewBlockSelectableOption struct {
	Text        string `json:"text"`
	Value       string `json:"value"`
	Description string `json:"description,omitempty"`
	Selected    *bool  `json:"selected,omitempty"`
}

type ViewBlockCheckboxOption struct {
	Text        string `json:"text"`
	Value       string `json:"value"`
	Description string `json:"description,omitempty"`
	Checked     *bool  `json:"checked,omitempty"`
}

type ViewBlockSelect struct {
	Type     string                      `json:"type"` // "select"
	Name     string                      `json:"name"`
	Label    string                      `json:"label"`
	Options  []ViewBlockSelectableOption `json:"options,omitempty"`
	Required *bool                       `json:"required,omitempty"`
	Hint     string                      `json:"hint,omitempty"`
}

type ViewBlockRadio struct {
	Type     string                      `json:"type"` // "radio"
	Name     string                      `json:"name"`
	Label    string                      `json:"label"`
	Options  []ViewBlockSelectableOption `json:"options,omitempty"`
	Required *bool                       `json:"required,omitempty"`
	Hint     string                      `json:"hint,omitempty"`
}

type ViewBlockCheckbox struct {
	Type     string                    `json:"type"` // "checkbox"
	Name     string                    `json:"name"`
	Label    string                    `json:"label"`
	Options  []ViewBlockCheckboxOption `json:"options,omitempty"`
	Required *bool                     `json:"required,omitempty"`
	Hint     string                    `json:"hint,omitempty"`
}

type ViewBlockDate struct {
	Type        string `json:"type"` // "date"
	Name        string `json:"name"`
	Label       string `json:"label"`
	InitialDate string `json:"initial_date,omitempty"`
	Required    *bool  `json:"required,omitempty"`
	Hint        string `json:"hint,omitempty"`
}

type ViewBlockTime struct {
	Type        string `json:"type"` // "time"
	Name        string `json:"name"`
	Label       string `json:"label"`
	InitialTime string `json:"initial_time,omitempty"`
	Required    *bool  `json:"required,omitempty"`
	Hint        string `json:"hint,omitempty"`
}

type ViewBlockFileInput struct {
	Type      string   `json:"type"` // "file_input"
	Name      string   `json:"name"`
	Label     string   `json:"label"`
	Filetypes []string `json:"filetypes,omitempty"`
	MaxFiles  *int32   `json:"max_files,omitempty"`
	Required  *bool    `json:"required,omitempty"`
	Hint      string   `json:"hint,omitempty"`
}

// ViewContent represents the modal view content.
type ViewContent struct {
	Title      string `json:"title"`
	CloseText  string `json:"close_text,omitempty"`
	SubmitText string `json:"submit_text,omitempty"`
	Blocks     []any  `json:"blocks"`
}

// OpenViewRequest is the request body for POST /views/open.
type OpenViewRequest struct {
	Type            string      `json:"type"`     // "modal"
	TriggerID       string      `json:"trigger_id"`
	PrivateMetadata string      `json:"private_metadata,omitempty"`
	CallbackID      string      `json:"callback_id,omitempty"`
	View            ViewContent `json:"view"`
}

// OpenView opens a modal view (POST /views/open).
// Requires the "views:write" scope.
func (s *ViewsService) OpenView(ctx context.Context, request OpenViewRequest) error {
	body, err := json.Marshal(request)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.serverURL+"/views/open", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return parseAPIError(resp)
	}
	return nil
}
