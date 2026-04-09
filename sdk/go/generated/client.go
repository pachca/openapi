package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"time"
)

type authTransport struct {
	token string
	base  http.RoundTripper
}

func (t *authTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+t.token)
	return t.base.RoundTrip(req)
}

type SecurityService interface {
	GetAuditEvents(ctx context.Context, params *GetAuditEventsParams) (*GetAuditEventsResponse, error)
	GetAuditEventsAll(ctx context.Context, params *GetAuditEventsParams) ([]AuditEvent, error)
}

type SecurityServiceStub struct{}

func (s *SecurityServiceStub) GetAuditEvents(ctx context.Context, params *GetAuditEventsParams) (*GetAuditEventsResponse, error) {
	return nil, NotImplementedError{Method: "Security.getAuditEvents"}
}

func (s *SecurityServiceStub) GetAuditEventsAll(ctx context.Context, params *GetAuditEventsParams) ([]AuditEvent, error) {
	return nil, NotImplementedError{Method: "Security.getAuditEventsAll"}
}

type SecurityServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *SecurityServiceImpl) GetAuditEvents(ctx context.Context, params *GetAuditEventsParams) (*GetAuditEventsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/audit_events", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.StartTime != nil {
		q.Set("start_time", params.StartTime.Format(time.RFC3339))
	}
	if params != nil && params.EndTime != nil {
		q.Set("end_time", params.EndTime.Format(time.RFC3339))
	}
	if params != nil && params.EventKey != nil {
		q.Set("event_key", string(*params.EventKey))
	}
	if params != nil && params.ActorID != nil {
		q.Set("actor_id", fmt.Sprintf("%v", *params.ActorID))
	}
	if params != nil && params.ActorType != nil {
		q.Set("actor_type", fmt.Sprintf("%v", *params.ActorType))
	}
	if params != nil && params.EntityID != nil {
		q.Set("entity_id", fmt.Sprintf("%v", *params.EntityID))
	}
	if params != nil && params.EntityType != nil {
		q.Set("entity_type", fmt.Sprintf("%v", *params.EntityType))
	}
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result GetAuditEventsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *SecurityServiceImpl) GetAuditEventsAll(ctx context.Context, params *GetAuditEventsParams) ([]AuditEvent, error) {
	if params == nil {
		params = &GetAuditEventsParams{}
	}
	var items []AuditEvent
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.GetAuditEvents(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

type BotsService interface {
	GetWebhookEvents(ctx context.Context, params *GetWebhookEventsParams) (*GetWebhookEventsResponse, error)
	GetWebhookEventsAll(ctx context.Context, params *GetWebhookEventsParams) ([]WebhookEvent, error)
	UpdateBot(ctx context.Context, id int32, request BotUpdateRequest) (*BotResponse, error)
	DeleteWebhookEvent(ctx context.Context, id string) error
}

type BotsServiceStub struct{}

func (s *BotsServiceStub) GetWebhookEvents(ctx context.Context, params *GetWebhookEventsParams) (*GetWebhookEventsResponse, error) {
	return nil, NotImplementedError{Method: "Bots.getWebhookEvents"}
}

func (s *BotsServiceStub) GetWebhookEventsAll(ctx context.Context, params *GetWebhookEventsParams) ([]WebhookEvent, error) {
	return nil, NotImplementedError{Method: "Bots.getWebhookEventsAll"}
}

func (s *BotsServiceStub) UpdateBot(ctx context.Context, id int32, request BotUpdateRequest) (*BotResponse, error) {
	return nil, NotImplementedError{Method: "Bots.updateBot"}
}

func (s *BotsServiceStub) DeleteWebhookEvent(ctx context.Context, id string) error {
	return NotImplementedError{Method: "Bots.deleteWebhookEvent"}
}

type BotsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *BotsServiceImpl) GetWebhookEvents(ctx context.Context, params *GetWebhookEventsParams) (*GetWebhookEventsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/webhooks/events", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result GetWebhookEventsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *BotsServiceImpl) GetWebhookEventsAll(ctx context.Context, params *GetWebhookEventsParams) ([]WebhookEvent, error) {
	if params == nil {
		params = &GetWebhookEventsParams{}
	}
	var items []WebhookEvent
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.GetWebhookEvents(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *BotsServiceImpl) UpdateBot(ctx context.Context, id int32, request BotUpdateRequest) (*BotResponse, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/bots/%v", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data BotResponse `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *BotsServiceImpl) DeleteWebhookEvent(ctx context.Context, id string) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/webhooks/events/%v", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type ChatsService interface {
	ListChats(ctx context.Context, params *ListChatsParams) (*ListChatsResponse, error)
	ListChatsAll(ctx context.Context, params *ListChatsParams) ([]Chat, error)
	GetChat(ctx context.Context, id int32) (*Chat, error)
	CreateChat(ctx context.Context, request ChatCreateRequest) (*Chat, error)
	UpdateChat(ctx context.Context, id int32, request ChatUpdateRequest) (*Chat, error)
	ArchiveChat(ctx context.Context, id int32) error
	UnarchiveChat(ctx context.Context, id int32) error
}

type ChatsServiceStub struct{}

func (s *ChatsServiceStub) ListChats(ctx context.Context, params *ListChatsParams) (*ListChatsResponse, error) {
	return nil, NotImplementedError{Method: "Chats.listChats"}
}

func (s *ChatsServiceStub) ListChatsAll(ctx context.Context, params *ListChatsParams) ([]Chat, error) {
	return nil, NotImplementedError{Method: "Chats.listChatsAll"}
}

func (s *ChatsServiceStub) GetChat(ctx context.Context, id int32) (*Chat, error) {
	return nil, NotImplementedError{Method: "Chats.getChat"}
}

func (s *ChatsServiceStub) CreateChat(ctx context.Context, request ChatCreateRequest) (*Chat, error) {
	return nil, NotImplementedError{Method: "Chats.createChat"}
}

func (s *ChatsServiceStub) UpdateChat(ctx context.Context, id int32, request ChatUpdateRequest) (*Chat, error) {
	return nil, NotImplementedError{Method: "Chats.updateChat"}
}

func (s *ChatsServiceStub) ArchiveChat(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Chats.archiveChat"}
}

func (s *ChatsServiceStub) UnarchiveChat(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Chats.unarchiveChat"}
}

type ChatsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *ChatsServiceImpl) ListChats(ctx context.Context, params *ListChatsParams) (*ListChatsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/chats", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Sort != nil {
		q.Set("sort", string(*params.Sort))
	}
	if params != nil && params.Order != nil {
		q.Set("order", string(*params.Order))
	}
	if params != nil && params.Availability != nil {
		q.Set("availability", string(*params.Availability))
	}
	if params != nil && params.LastMessageAtAfter != nil {
		q.Set("last_message_at_after", params.LastMessageAtAfter.Format(time.RFC3339))
	}
	if params != nil && params.LastMessageAtBefore != nil {
		q.Set("last_message_at_before", params.LastMessageAtBefore.Format(time.RFC3339))
	}
	if params != nil && params.Personal != nil {
		q.Set("personal", fmt.Sprintf("%v", *params.Personal))
	}
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result ListChatsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ChatsServiceImpl) ListChatsAll(ctx context.Context, params *ListChatsParams) ([]Chat, error) {
	if params == nil {
		params = &ListChatsParams{}
	}
	var items []Chat
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.ListChats(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *ChatsServiceImpl) GetChat(ctx context.Context, id int32) (*Chat, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/chats/%v", s.baseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data Chat `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ChatsServiceImpl) CreateChat(ctx context.Context, request ChatCreateRequest) (*Chat, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/chats", s.baseURL), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		var result struct {
			Data Chat `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ChatsServiceImpl) UpdateChat(ctx context.Context, id int32, request ChatUpdateRequest) (*Chat, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/chats/%v", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data Chat `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ChatsServiceImpl) ArchiveChat(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/chats/%v/archive", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *ChatsServiceImpl) UnarchiveChat(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/chats/%v/unarchive", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type CommonService interface {
	DownloadExport(ctx context.Context, id int32) (string, error)
	ListProperties(ctx context.Context, params ListPropertiesParams) (*ListPropertiesResponse, error)
	RequestExport(ctx context.Context, request ExportRequest) error
	UploadFile(ctx context.Context, directUrl string, request FileUploadRequest) error
	GetUploadParams(ctx context.Context) (*UploadParams, error)
}

type CommonServiceStub struct{}

func (s *CommonServiceStub) DownloadExport(ctx context.Context, id int32) (string, error) {
	return "", NotImplementedError{Method: "Common.downloadExport"}
}

func (s *CommonServiceStub) ListProperties(ctx context.Context, params ListPropertiesParams) (*ListPropertiesResponse, error) {
	return nil, NotImplementedError{Method: "Common.listProperties"}
}

func (s *CommonServiceStub) RequestExport(ctx context.Context, request ExportRequest) error {
	return NotImplementedError{Method: "Common.requestExport"}
}

func (s *CommonServiceStub) UploadFile(ctx context.Context, directUrl string, request FileUploadRequest) error {
	return NotImplementedError{Method: "Common.uploadFile"}
}

func (s *CommonServiceStub) GetUploadParams(ctx context.Context) (*UploadParams, error) {
	return nil, NotImplementedError{Method: "Common.getUploadParams"}
}

type CommonServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *CommonServiceImpl) DownloadExport(ctx context.Context, id int32) (string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/chats/exports/%v", s.baseURL, id), nil)
	if err != nil {
		return "", err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusFound:
		location := resp.Header.Get("Location")
		if location == "" {
			return "", errors.New("missing Location header in redirect response")
		}
		return location, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return "", &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return "", fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return "", &e
	}
}

func (s *CommonServiceImpl) ListProperties(ctx context.Context, params ListPropertiesParams) (*ListPropertiesResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/custom_properties", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	q.Set("entity_type", string(params.EntityType))
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result ListPropertiesResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *CommonServiceImpl) RequestExport(ctx context.Context, request ExportRequest) error {
	body, err := json.Marshal(request)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/chats/exports", s.baseURL), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *CommonServiceImpl) UploadFile(ctx context.Context, directUrl string, request FileUploadRequest) error {
	pr, pw := io.Pipe()
	writer := multipart.NewWriter(pw)
	go func() {
		defer pw.Close()
		defer writer.Close()
		writer.WriteField("Content-Disposition", fmt.Sprintf("%v", request.ContentDisposition))
		writer.WriteField("acl", fmt.Sprintf("%v", request.ACL))
		writer.WriteField("policy", fmt.Sprintf("%v", request.Policy))
		writer.WriteField("x-amz-credential", fmt.Sprintf("%v", request.XAMZCredential))
		writer.WriteField("x-amz-algorithm", fmt.Sprintf("%v", request.XAMZAlgorithm))
		writer.WriteField("x-amz-date", fmt.Sprintf("%v", request.XAMZDate))
		writer.WriteField("x-amz-signature", fmt.Sprintf("%v", request.XAMZSignature))
		writer.WriteField("key", fmt.Sprintf("%v", request.Key))
		part, err := writer.CreateFormFile("file", "upload")
		if err != nil {
			pw.CloseWithError(err)
			return
		}
		if _, err := io.Copy(part, request.File); err != nil {
			pw.CloseWithError(err)
			return
		}
	}()
	req, err := http.NewRequestWithContext(ctx, "POST", directUrl, pr)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	resp, err := doWithRetry(http.DefaultClient, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *CommonServiceImpl) GetUploadParams(ctx context.Context) (*UploadParams, error) {
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/uploads", s.baseURL), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		var result UploadParams
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

type MembersService interface {
	ListMembers(ctx context.Context, id int32, params *ListMembersParams) (*ListMembersResponse, error)
	ListMembersAll(ctx context.Context, id int32, params *ListMembersParams) ([]User, error)
	AddTags(ctx context.Context, id int32, groupTagIds []int32) error
	AddMembers(ctx context.Context, id int32, request AddMembersRequest) error
	UpdateMemberRole(ctx context.Context, id int32, userId int32, role ChatMemberRole) error
	RemoveTag(ctx context.Context, id int32, tagId int32) error
	LeaveChat(ctx context.Context, id int32) error
	RemoveMember(ctx context.Context, id int32, userId int32) error
}

type MembersServiceStub struct{}

func (s *MembersServiceStub) ListMembers(ctx context.Context, id int32, params *ListMembersParams) (*ListMembersResponse, error) {
	return nil, NotImplementedError{Method: "Members.listMembers"}
}

func (s *MembersServiceStub) ListMembersAll(ctx context.Context, id int32, params *ListMembersParams) ([]User, error) {
	return nil, NotImplementedError{Method: "Members.listMembersAll"}
}

func (s *MembersServiceStub) AddTags(ctx context.Context, id int32, groupTagIds []int32) error {
	return NotImplementedError{Method: "Members.addTags"}
}

func (s *MembersServiceStub) AddMembers(ctx context.Context, id int32, request AddMembersRequest) error {
	return NotImplementedError{Method: "Members.addMembers"}
}

func (s *MembersServiceStub) UpdateMemberRole(ctx context.Context, id int32, userId int32, role ChatMemberRole) error {
	return NotImplementedError{Method: "Members.updateMemberRole"}
}

func (s *MembersServiceStub) RemoveTag(ctx context.Context, id int32, tagId int32) error {
	return NotImplementedError{Method: "Members.removeTag"}
}

func (s *MembersServiceStub) LeaveChat(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Members.leaveChat"}
}

func (s *MembersServiceStub) RemoveMember(ctx context.Context, id int32, userId int32) error {
	return NotImplementedError{Method: "Members.removeMember"}
}

type MembersServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *MembersServiceImpl) ListMembers(ctx context.Context, id int32, params *ListMembersParams) (*ListMembersResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/chats/%v/members", s.baseURL, id))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Role != nil {
		q.Set("role", string(*params.Role))
	}
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result ListMembersResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *MembersServiceImpl) ListMembersAll(ctx context.Context, id int32, params *ListMembersParams) ([]User, error) {
	if params == nil {
		params = &ListMembersParams{}
	}
	var items []User
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.ListMembers(ctx, id, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *MembersServiceImpl) AddTags(ctx context.Context, id int32, groupTagIds []int32) error {
	body, err := json.Marshal(map[string]any{"group_tag_ids": groupTagIds})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/chats/%v/group_tags", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *MembersServiceImpl) AddMembers(ctx context.Context, id int32, request AddMembersRequest) error {
	body, err := json.Marshal(request)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/chats/%v/members", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *MembersServiceImpl) UpdateMemberRole(ctx context.Context, id int32, userId int32, role ChatMemberRole) error {
	body, err := json.Marshal(map[string]any{"role": role})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/chats/%v/members/%v", s.baseURL, id, userId), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *MembersServiceImpl) RemoveTag(ctx context.Context, id int32, tagId int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/chats/%v/group_tags/%v", s.baseURL, id, tagId), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *MembersServiceImpl) LeaveChat(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/chats/%v/leave", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *MembersServiceImpl) RemoveMember(ctx context.Context, id int32, userId int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/chats/%v/members/%v", s.baseURL, id, userId), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type GroupTagsService interface {
	ListTags(ctx context.Context, params *ListTagsParams) (*ListTagsResponse, error)
	ListTagsAll(ctx context.Context, params *ListTagsParams) ([]GroupTag, error)
	GetTag(ctx context.Context, id int32) (*GroupTag, error)
	GetTagUsers(ctx context.Context, id int32, params *GetTagUsersParams) (*GetTagUsersResponse, error)
	GetTagUsersAll(ctx context.Context, id int32, params *GetTagUsersParams) ([]User, error)
	CreateTag(ctx context.Context, request GroupTagRequest) (*GroupTag, error)
	UpdateTag(ctx context.Context, id int32, request GroupTagRequest) (*GroupTag, error)
	DeleteTag(ctx context.Context, id int32) error
}

type GroupTagsServiceStub struct{}

func (s *GroupTagsServiceStub) ListTags(ctx context.Context, params *ListTagsParams) (*ListTagsResponse, error) {
	return nil, NotImplementedError{Method: "Group tags.listTags"}
}

func (s *GroupTagsServiceStub) ListTagsAll(ctx context.Context, params *ListTagsParams) ([]GroupTag, error) {
	return nil, NotImplementedError{Method: "Group tags.listTagsAll"}
}

func (s *GroupTagsServiceStub) GetTag(ctx context.Context, id int32) (*GroupTag, error) {
	return nil, NotImplementedError{Method: "Group tags.getTag"}
}

func (s *GroupTagsServiceStub) GetTagUsers(ctx context.Context, id int32, params *GetTagUsersParams) (*GetTagUsersResponse, error) {
	return nil, NotImplementedError{Method: "Group tags.getTagUsers"}
}

func (s *GroupTagsServiceStub) GetTagUsersAll(ctx context.Context, id int32, params *GetTagUsersParams) ([]User, error) {
	return nil, NotImplementedError{Method: "Group tags.getTagUsersAll"}
}

func (s *GroupTagsServiceStub) CreateTag(ctx context.Context, request GroupTagRequest) (*GroupTag, error) {
	return nil, NotImplementedError{Method: "Group tags.createTag"}
}

func (s *GroupTagsServiceStub) UpdateTag(ctx context.Context, id int32, request GroupTagRequest) (*GroupTag, error) {
	return nil, NotImplementedError{Method: "Group tags.updateTag"}
}

func (s *GroupTagsServiceStub) DeleteTag(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Group tags.deleteTag"}
}

type GroupTagsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *GroupTagsServiceImpl) ListTags(ctx context.Context, params *ListTagsParams) (*ListTagsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/group_tags", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil {
		for _, v := range params.Names {
			q.Add("names[]", fmt.Sprintf("%v", v))
		}
	}
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result ListTagsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *GroupTagsServiceImpl) ListTagsAll(ctx context.Context, params *ListTagsParams) ([]GroupTag, error) {
	if params == nil {
		params = &ListTagsParams{}
	}
	var items []GroupTag
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.ListTags(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *GroupTagsServiceImpl) GetTag(ctx context.Context, id int32) (*GroupTag, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/group_tags/%v", s.baseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data GroupTag `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *GroupTagsServiceImpl) GetTagUsers(ctx context.Context, id int32, params *GetTagUsersParams) (*GetTagUsersResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/group_tags/%v/users", s.baseURL, id))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result GetTagUsersResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *GroupTagsServiceImpl) GetTagUsersAll(ctx context.Context, id int32, params *GetTagUsersParams) ([]User, error) {
	if params == nil {
		params = &GetTagUsersParams{}
	}
	var items []User
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.GetTagUsers(ctx, id, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *GroupTagsServiceImpl) CreateTag(ctx context.Context, request GroupTagRequest) (*GroupTag, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/group_tags", s.baseURL), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		var result struct {
			Data GroupTag `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *GroupTagsServiceImpl) UpdateTag(ctx context.Context, id int32, request GroupTagRequest) (*GroupTag, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/group_tags/%v", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data GroupTag `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *GroupTagsServiceImpl) DeleteTag(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/group_tags/%v", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type MessagesService interface {
	ListChatMessages(ctx context.Context, params ListChatMessagesParams) (*ListChatMessagesResponse, error)
	ListChatMessagesAll(ctx context.Context, params *ListChatMessagesParams) ([]Message, error)
	GetMessage(ctx context.Context, id int32) (*Message, error)
	CreateMessage(ctx context.Context, request MessageCreateRequest) (*Message, error)
	PinMessage(ctx context.Context, id int32) error
	UpdateMessage(ctx context.Context, id int32, request MessageUpdateRequest) (*Message, error)
	DeleteMessage(ctx context.Context, id int32) error
	UnpinMessage(ctx context.Context, id int32) error
}

type MessagesServiceStub struct{}

func (s *MessagesServiceStub) ListChatMessages(ctx context.Context, params ListChatMessagesParams) (*ListChatMessagesResponse, error) {
	return nil, NotImplementedError{Method: "Messages.listChatMessages"}
}

func (s *MessagesServiceStub) ListChatMessagesAll(ctx context.Context, params *ListChatMessagesParams) ([]Message, error) {
	return nil, NotImplementedError{Method: "Messages.listChatMessagesAll"}
}

func (s *MessagesServiceStub) GetMessage(ctx context.Context, id int32) (*Message, error) {
	return nil, NotImplementedError{Method: "Messages.getMessage"}
}

func (s *MessagesServiceStub) CreateMessage(ctx context.Context, request MessageCreateRequest) (*Message, error) {
	return nil, NotImplementedError{Method: "Messages.createMessage"}
}

func (s *MessagesServiceStub) PinMessage(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Messages.pinMessage"}
}

func (s *MessagesServiceStub) UpdateMessage(ctx context.Context, id int32, request MessageUpdateRequest) (*Message, error) {
	return nil, NotImplementedError{Method: "Messages.updateMessage"}
}

func (s *MessagesServiceStub) DeleteMessage(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Messages.deleteMessage"}
}

func (s *MessagesServiceStub) UnpinMessage(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Messages.unpinMessage"}
}

type MessagesServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *MessagesServiceImpl) ListChatMessages(ctx context.Context, params ListChatMessagesParams) (*ListChatMessagesResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/messages", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	q.Set("chat_id", fmt.Sprintf("%v", params.ChatID))
	if params.Sort != nil {
		q.Set("sort", string(*params.Sort))
	}
	if params.Order != nil {
		q.Set("order", string(*params.Order))
	}
	if params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result ListChatMessagesResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *MessagesServiceImpl) ListChatMessagesAll(ctx context.Context, params *ListChatMessagesParams) ([]Message, error) {
	if params == nil {
		params = &ListChatMessagesParams{}
	}
	var items []Message
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.ListChatMessages(ctx, *params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *MessagesServiceImpl) GetMessage(ctx context.Context, id int32) (*Message, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/messages/%v", s.baseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data Message `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *MessagesServiceImpl) CreateMessage(ctx context.Context, request MessageCreateRequest) (*Message, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/messages", s.baseURL), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		var result struct {
			Data Message `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *MessagesServiceImpl) PinMessage(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/messages/%v/pin", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *MessagesServiceImpl) UpdateMessage(ctx context.Context, id int32, request MessageUpdateRequest) (*Message, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/messages/%v", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data Message `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *MessagesServiceImpl) DeleteMessage(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/messages/%v", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *MessagesServiceImpl) UnpinMessage(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/messages/%v/pin", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type LinkPreviewsService interface {
	CreateLinkPreviews(ctx context.Context, id int32, request LinkPreviewsRequest) error
}

type LinkPreviewsServiceStub struct{}

func (s *LinkPreviewsServiceStub) CreateLinkPreviews(ctx context.Context, id int32, request LinkPreviewsRequest) error {
	return NotImplementedError{Method: "Link Previews.createLinkPreviews"}
}

type LinkPreviewsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *LinkPreviewsServiceImpl) CreateLinkPreviews(ctx context.Context, id int32, request LinkPreviewsRequest) error {
	body, err := json.Marshal(request)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/messages/%v/link_previews", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type ReactionsService interface {
	ListReactions(ctx context.Context, id int32, params *ListReactionsParams) (*ListReactionsResponse, error)
	ListReactionsAll(ctx context.Context, id int32, params *ListReactionsParams) ([]Reaction, error)
	AddReaction(ctx context.Context, id int32, request ReactionRequest) (*Reaction, error)
	RemoveReaction(ctx context.Context, id int32, params RemoveReactionParams) error
}

type ReactionsServiceStub struct{}

func (s *ReactionsServiceStub) ListReactions(ctx context.Context, id int32, params *ListReactionsParams) (*ListReactionsResponse, error) {
	return nil, NotImplementedError{Method: "Reactions.listReactions"}
}

func (s *ReactionsServiceStub) ListReactionsAll(ctx context.Context, id int32, params *ListReactionsParams) ([]Reaction, error) {
	return nil, NotImplementedError{Method: "Reactions.listReactionsAll"}
}

func (s *ReactionsServiceStub) AddReaction(ctx context.Context, id int32, request ReactionRequest) (*Reaction, error) {
	return nil, NotImplementedError{Method: "Reactions.addReaction"}
}

func (s *ReactionsServiceStub) RemoveReaction(ctx context.Context, id int32, params RemoveReactionParams) error {
	return NotImplementedError{Method: "Reactions.removeReaction"}
}

type ReactionsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *ReactionsServiceImpl) ListReactions(ctx context.Context, id int32, params *ListReactionsParams) (*ListReactionsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/messages/%v/reactions", s.baseURL, id))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result ListReactionsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ReactionsServiceImpl) ListReactionsAll(ctx context.Context, id int32, params *ListReactionsParams) ([]Reaction, error) {
	if params == nil {
		params = &ListReactionsParams{}
	}
	var items []Reaction
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.ListReactions(ctx, id, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *ReactionsServiceImpl) AddReaction(ctx context.Context, id int32, request ReactionRequest) (*Reaction, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/messages/%v/reactions", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		var result Reaction
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ReactionsServiceImpl) RemoveReaction(ctx context.Context, id int32, params RemoveReactionParams) error {
	u, err := url.Parse(fmt.Sprintf("%s/messages/%v/reactions", s.baseURL, id))
	if err != nil {
		return err
	}
	q := u.Query()
	q.Set("code", fmt.Sprintf("%v", params.Code))
	if params.Name != nil {
		q.Set("name", fmt.Sprintf("%v", *params.Name))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "DELETE", u.String(), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type ReadMembersService interface {
	ListReadMembers(ctx context.Context, id int32, params *ListReadMembersParams) (*any, error)
}

type ReadMembersServiceStub struct{}

func (s *ReadMembersServiceStub) ListReadMembers(ctx context.Context, id int32, params *ListReadMembersParams) (*any, error) {
	return nil, NotImplementedError{Method: "Read members.listReadMembers"}
}

type ReadMembersServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *ReadMembersServiceImpl) ListReadMembers(ctx context.Context, id int32, params *ListReadMembersParams) (*any, error) {
	u, err := url.Parse(fmt.Sprintf("%s/messages/%v/read_member_ids", s.baseURL, id))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result any
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

type ThreadsService interface {
	GetThread(ctx context.Context, id int32) (*Thread, error)
	CreateThread(ctx context.Context, id int32) (*Thread, error)
}

type ThreadsServiceStub struct{}

func (s *ThreadsServiceStub) GetThread(ctx context.Context, id int32) (*Thread, error) {
	return nil, NotImplementedError{Method: "Threads.getThread"}
}

func (s *ThreadsServiceStub) CreateThread(ctx context.Context, id int32) (*Thread, error) {
	return nil, NotImplementedError{Method: "Threads.createThread"}
}

type ThreadsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *ThreadsServiceImpl) GetThread(ctx context.Context, id int32) (*Thread, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/threads/%v", s.baseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data Thread `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ThreadsServiceImpl) CreateThread(ctx context.Context, id int32) (*Thread, error) {
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/messages/%v/thread", s.baseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		var result struct {
			Data Thread `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

type ProfileService interface {
	GetTokenInfo(ctx context.Context) (*AccessTokenInfo, error)
	GetProfile(ctx context.Context) (*User, error)
	GetStatus(ctx context.Context) (*any, error)
	UpdateProfileAvatar(ctx context.Context, image io.Reader) (*AvatarData, error)
	UpdateStatus(ctx context.Context, request StatusUpdateRequest) (*UserStatus, error)
	DeleteProfileAvatar(ctx context.Context) error
	DeleteStatus(ctx context.Context) error
}

type ProfileServiceStub struct{}

func (s *ProfileServiceStub) GetTokenInfo(ctx context.Context) (*AccessTokenInfo, error) {
	return nil, NotImplementedError{Method: "Profile.getTokenInfo"}
}

func (s *ProfileServiceStub) GetProfile(ctx context.Context) (*User, error) {
	return nil, NotImplementedError{Method: "Profile.getProfile"}
}

func (s *ProfileServiceStub) GetStatus(ctx context.Context) (*any, error) {
	return nil, NotImplementedError{Method: "Profile.getStatus"}
}

func (s *ProfileServiceStub) UpdateProfileAvatar(ctx context.Context, image io.Reader) (*AvatarData, error) {
	return nil, NotImplementedError{Method: "Profile.updateProfileAvatar"}
}

func (s *ProfileServiceStub) UpdateStatus(ctx context.Context, request StatusUpdateRequest) (*UserStatus, error) {
	return nil, NotImplementedError{Method: "Profile.updateStatus"}
}

func (s *ProfileServiceStub) DeleteProfileAvatar(ctx context.Context) error {
	return NotImplementedError{Method: "Profile.deleteProfileAvatar"}
}

func (s *ProfileServiceStub) DeleteStatus(ctx context.Context) error {
	return NotImplementedError{Method: "Profile.deleteStatus"}
}

type ProfileServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *ProfileServiceImpl) GetTokenInfo(ctx context.Context) (*AccessTokenInfo, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/oauth/token/info", s.baseURL), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data AccessTokenInfo `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ProfileServiceImpl) GetProfile(ctx context.Context) (*User, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/profile", s.baseURL), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data User `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ProfileServiceImpl) GetStatus(ctx context.Context) (*any, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/profile/status", s.baseURL), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result any
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ProfileServiceImpl) UpdateProfileAvatar(ctx context.Context, image io.Reader) (*AvatarData, error) {
	pr, pw := io.Pipe()
	writer := multipart.NewWriter(pw)
	go func() {
		defer pw.Close()
		defer writer.Close()
		part, err := writer.CreateFormFile("image", "upload")
		if err != nil {
			pw.CloseWithError(err)
			return
		}
		if _, err := io.Copy(part, image); err != nil {
			pw.CloseWithError(err)
			return
		}
	}()
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/profile/avatar", s.baseURL), pr)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data AvatarData `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ProfileServiceImpl) UpdateStatus(ctx context.Context, request StatusUpdateRequest) (*UserStatus, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/profile/status", s.baseURL), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data UserStatus `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *ProfileServiceImpl) DeleteProfileAvatar(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/profile/avatar", s.baseURL), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *ProfileServiceImpl) DeleteStatus(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/profile/status", s.baseURL), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type SearchService interface {
	SearchChats(ctx context.Context, params *SearchChatsParams) (*SearchChatsResponse, error)
	SearchChatsAll(ctx context.Context, params *SearchChatsParams) ([]Chat, error)
	SearchMessages(ctx context.Context, params *SearchMessagesParams) (*SearchMessagesResponse, error)
	SearchMessagesAll(ctx context.Context, params *SearchMessagesParams) ([]Message, error)
	SearchUsers(ctx context.Context, params *SearchUsersParams) (*SearchUsersResponse, error)
	SearchUsersAll(ctx context.Context, params *SearchUsersParams) ([]User, error)
}

type SearchServiceStub struct{}

func (s *SearchServiceStub) SearchChats(ctx context.Context, params *SearchChatsParams) (*SearchChatsResponse, error) {
	return nil, NotImplementedError{Method: "Search.searchChats"}
}

func (s *SearchServiceStub) SearchChatsAll(ctx context.Context, params *SearchChatsParams) ([]Chat, error) {
	return nil, NotImplementedError{Method: "Search.searchChatsAll"}
}

func (s *SearchServiceStub) SearchMessages(ctx context.Context, params *SearchMessagesParams) (*SearchMessagesResponse, error) {
	return nil, NotImplementedError{Method: "Search.searchMessages"}
}

func (s *SearchServiceStub) SearchMessagesAll(ctx context.Context, params *SearchMessagesParams) ([]Message, error) {
	return nil, NotImplementedError{Method: "Search.searchMessagesAll"}
}

func (s *SearchServiceStub) SearchUsers(ctx context.Context, params *SearchUsersParams) (*SearchUsersResponse, error) {
	return nil, NotImplementedError{Method: "Search.searchUsers"}
}

func (s *SearchServiceStub) SearchUsersAll(ctx context.Context, params *SearchUsersParams) ([]User, error) {
	return nil, NotImplementedError{Method: "Search.searchUsersAll"}
}

type SearchServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *SearchServiceImpl) SearchChats(ctx context.Context, params *SearchChatsParams) (*SearchChatsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/search/chats", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Query != nil {
		q.Set("query", fmt.Sprintf("%v", *params.Query))
	}
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	if params != nil && params.Order != nil {
		q.Set("order", string(*params.Order))
	}
	if params != nil && params.CreatedFrom != nil {
		q.Set("created_from", params.CreatedFrom.Format(time.RFC3339))
	}
	if params != nil && params.CreatedTo != nil {
		q.Set("created_to", params.CreatedTo.Format(time.RFC3339))
	}
	if params != nil && params.Active != nil {
		q.Set("active", fmt.Sprintf("%v", *params.Active))
	}
	if params != nil && params.ChatSubtype != nil {
		q.Set("chat_subtype", string(*params.ChatSubtype))
	}
	if params != nil && params.Personal != nil {
		q.Set("personal", fmt.Sprintf("%v", *params.Personal))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result SearchChatsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *SearchServiceImpl) SearchChatsAll(ctx context.Context, params *SearchChatsParams) ([]Chat, error) {
	if params == nil {
		params = &SearchChatsParams{}
	}
	var items []Chat
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.SearchChats(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *SearchServiceImpl) SearchMessages(ctx context.Context, params *SearchMessagesParams) (*SearchMessagesResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/search/messages", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Query != nil {
		q.Set("query", fmt.Sprintf("%v", *params.Query))
	}
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	if params != nil && params.Order != nil {
		q.Set("order", string(*params.Order))
	}
	if params != nil && params.CreatedFrom != nil {
		q.Set("created_from", params.CreatedFrom.Format(time.RFC3339))
	}
	if params != nil && params.CreatedTo != nil {
		q.Set("created_to", params.CreatedTo.Format(time.RFC3339))
	}
	if params != nil {
		for _, v := range params.ChatIDs {
			q.Add("chat_ids[]", fmt.Sprintf("%v", v))
		}
	}
	if params != nil {
		for _, v := range params.UserIDs {
			q.Add("user_ids[]", fmt.Sprintf("%v", v))
		}
	}
	if params != nil && params.Active != nil {
		q.Set("active", fmt.Sprintf("%v", *params.Active))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result SearchMessagesResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *SearchServiceImpl) SearchMessagesAll(ctx context.Context, params *SearchMessagesParams) ([]Message, error) {
	if params == nil {
		params = &SearchMessagesParams{}
	}
	var items []Message
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.SearchMessages(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *SearchServiceImpl) SearchUsers(ctx context.Context, params *SearchUsersParams) (*SearchUsersResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/search/users", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Query != nil {
		q.Set("query", fmt.Sprintf("%v", *params.Query))
	}
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	if params != nil && params.Sort != nil {
		q.Set("sort", string(*params.Sort))
	}
	if params != nil && params.Order != nil {
		q.Set("order", string(*params.Order))
	}
	if params != nil && params.CreatedFrom != nil {
		q.Set("created_from", params.CreatedFrom.Format(time.RFC3339))
	}
	if params != nil && params.CreatedTo != nil {
		q.Set("created_to", params.CreatedTo.Format(time.RFC3339))
	}
	if params != nil {
		for _, v := range params.CompanyRoles {
			q.Add("company_roles[]", fmt.Sprintf("%v", v))
		}
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result SearchUsersResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *SearchServiceImpl) SearchUsersAll(ctx context.Context, params *SearchUsersParams) ([]User, error) {
	if params == nil {
		params = &SearchUsersParams{}
	}
	var items []User
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.SearchUsers(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

type TasksService interface {
	ListTasks(ctx context.Context, params *ListTasksParams) (*ListTasksResponse, error)
	ListTasksAll(ctx context.Context, params *ListTasksParams) ([]Task, error)
	GetTask(ctx context.Context, id int32) (*Task, error)
	CreateTask(ctx context.Context, request TaskCreateRequest) (*Task, error)
	UpdateTask(ctx context.Context, id int32, request TaskUpdateRequest) (*Task, error)
	DeleteTask(ctx context.Context, id int32) error
}

type TasksServiceStub struct{}

func (s *TasksServiceStub) ListTasks(ctx context.Context, params *ListTasksParams) (*ListTasksResponse, error) {
	return nil, NotImplementedError{Method: "Tasks.listTasks"}
}

func (s *TasksServiceStub) ListTasksAll(ctx context.Context, params *ListTasksParams) ([]Task, error) {
	return nil, NotImplementedError{Method: "Tasks.listTasksAll"}
}

func (s *TasksServiceStub) GetTask(ctx context.Context, id int32) (*Task, error) {
	return nil, NotImplementedError{Method: "Tasks.getTask"}
}

func (s *TasksServiceStub) CreateTask(ctx context.Context, request TaskCreateRequest) (*Task, error) {
	return nil, NotImplementedError{Method: "Tasks.createTask"}
}

func (s *TasksServiceStub) UpdateTask(ctx context.Context, id int32, request TaskUpdateRequest) (*Task, error) {
	return nil, NotImplementedError{Method: "Tasks.updateTask"}
}

func (s *TasksServiceStub) DeleteTask(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Tasks.deleteTask"}
}

type TasksServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *TasksServiceImpl) ListTasks(ctx context.Context, params *ListTasksParams) (*ListTasksResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/tasks", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result ListTasksResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *TasksServiceImpl) ListTasksAll(ctx context.Context, params *ListTasksParams) ([]Task, error) {
	if params == nil {
		params = &ListTasksParams{}
	}
	var items []Task
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.ListTasks(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *TasksServiceImpl) GetTask(ctx context.Context, id int32) (*Task, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/tasks/%v", s.baseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data Task `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *TasksServiceImpl) CreateTask(ctx context.Context, request TaskCreateRequest) (*Task, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/tasks", s.baseURL), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		var result struct {
			Data Task `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *TasksServiceImpl) UpdateTask(ctx context.Context, id int32, request TaskUpdateRequest) (*Task, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/tasks/%v", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data Task `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *TasksServiceImpl) DeleteTask(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/tasks/%v", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type UsersService interface {
	ListUsers(ctx context.Context, params *ListUsersParams) (*ListUsersResponse, error)
	ListUsersAll(ctx context.Context, params *ListUsersParams) ([]User, error)
	GetUser(ctx context.Context, id int32) (*User, error)
	GetUserStatus(ctx context.Context, userId int32) (*any, error)
	CreateUser(ctx context.Context, request UserCreateRequest) (*User, error)
	UpdateUser(ctx context.Context, id int32, request UserUpdateRequest) (*User, error)
	UpdateUserAvatar(ctx context.Context, userId int32, image io.Reader) (*AvatarData, error)
	UpdateUserStatus(ctx context.Context, userId int32, request StatusUpdateRequest) (*UserStatus, error)
	DeleteUser(ctx context.Context, id int32) error
	DeleteUserAvatar(ctx context.Context, userId int32) error
	DeleteUserStatus(ctx context.Context, userId int32) error
}

type UsersServiceStub struct{}

func (s *UsersServiceStub) ListUsers(ctx context.Context, params *ListUsersParams) (*ListUsersResponse, error) {
	return nil, NotImplementedError{Method: "Users.listUsers"}
}

func (s *UsersServiceStub) ListUsersAll(ctx context.Context, params *ListUsersParams) ([]User, error) {
	return nil, NotImplementedError{Method: "Users.listUsersAll"}
}

func (s *UsersServiceStub) GetUser(ctx context.Context, id int32) (*User, error) {
	return nil, NotImplementedError{Method: "Users.getUser"}
}

func (s *UsersServiceStub) GetUserStatus(ctx context.Context, userId int32) (*any, error) {
	return nil, NotImplementedError{Method: "Users.getUserStatus"}
}

func (s *UsersServiceStub) CreateUser(ctx context.Context, request UserCreateRequest) (*User, error) {
	return nil, NotImplementedError{Method: "Users.createUser"}
}

func (s *UsersServiceStub) UpdateUser(ctx context.Context, id int32, request UserUpdateRequest) (*User, error) {
	return nil, NotImplementedError{Method: "Users.updateUser"}
}

func (s *UsersServiceStub) UpdateUserAvatar(ctx context.Context, userId int32, image io.Reader) (*AvatarData, error) {
	return nil, NotImplementedError{Method: "Users.updateUserAvatar"}
}

func (s *UsersServiceStub) UpdateUserStatus(ctx context.Context, userId int32, request StatusUpdateRequest) (*UserStatus, error) {
	return nil, NotImplementedError{Method: "Users.updateUserStatus"}
}

func (s *UsersServiceStub) DeleteUser(ctx context.Context, id int32) error {
	return NotImplementedError{Method: "Users.deleteUser"}
}

func (s *UsersServiceStub) DeleteUserAvatar(ctx context.Context, userId int32) error {
	return NotImplementedError{Method: "Users.deleteUserAvatar"}
}

func (s *UsersServiceStub) DeleteUserStatus(ctx context.Context, userId int32) error {
	return NotImplementedError{Method: "Users.deleteUserStatus"}
}

type UsersServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *UsersServiceImpl) ListUsers(ctx context.Context, params *ListUsersParams) (*ListUsersResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/users", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Query != nil {
		q.Set("query", fmt.Sprintf("%v", *params.Query))
	}
	if params != nil && params.Limit != nil {
		q.Set("limit", fmt.Sprintf("%v", *params.Limit))
	}
	if params != nil && params.Cursor != nil {
		q.Set("cursor", fmt.Sprintf("%v", *params.Cursor))
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result ListUsersResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *UsersServiceImpl) ListUsersAll(ctx context.Context, params *ListUsersParams) ([]User, error) {
	if params == nil {
		params = &ListUsersParams{}
	}
	var items []User
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.ListUsers(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if len(result.Data) == 0 {
			return items, nil
		}
		nextPage := result.Meta.Paginate.NextPage
		cursor = &nextPage
	}
}

func (s *UsersServiceImpl) GetUser(ctx context.Context, id int32) (*User, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/users/%v", s.baseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data User `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *UsersServiceImpl) GetUserStatus(ctx context.Context, userId int32) (*any, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/users/%v/status", s.baseURL, userId), nil)
	if err != nil {
		return nil, err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result any
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *UsersServiceImpl) CreateUser(ctx context.Context, request UserCreateRequest) (*User, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/users", s.baseURL), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		var result struct {
			Data User `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *UsersServiceImpl) UpdateUser(ctx context.Context, id int32, request UserUpdateRequest) (*User, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/users/%v", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data User `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *UsersServiceImpl) UpdateUserAvatar(ctx context.Context, userId int32, image io.Reader) (*AvatarData, error) {
	pr, pw := io.Pipe()
	writer := multipart.NewWriter(pw)
	go func() {
		defer pw.Close()
		defer writer.Close()
		part, err := writer.CreateFormFile("image", "upload")
		if err != nil {
			pw.CloseWithError(err)
			return
		}
		if _, err := io.Copy(part, image); err != nil {
			pw.CloseWithError(err)
			return
		}
	}()
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/users/%v/avatar", s.baseURL, userId), pr)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data AvatarData `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *UsersServiceImpl) UpdateUserStatus(ctx context.Context, userId int32, request StatusUpdateRequest) (*UserStatus, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/users/%v/status", s.baseURL, userId), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		var result struct {
			Data UserStatus `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result.Data, nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return nil, &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return nil, &e
	}
}

func (s *UsersServiceImpl) DeleteUser(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/users/%v", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *UsersServiceImpl) DeleteUserAvatar(ctx context.Context, userId int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/users/%v/avatar", s.baseURL, userId), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

func (s *UsersServiceImpl) DeleteUserStatus(ctx context.Context, userId int32) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", fmt.Sprintf("%s/users/%v/status", s.baseURL, userId), nil)
	if err != nil {
		return err
	}
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type ViewsService interface {
	OpenView(ctx context.Context, request OpenViewRequest) error
}

type ViewsServiceStub struct{}

func (s *ViewsServiceStub) OpenView(ctx context.Context, request OpenViewRequest) error {
	return NotImplementedError{Method: "Views.openView"}
}

type ViewsServiceImpl struct {
	baseURL string
	client  *http.Client
}

func (s *ViewsServiceImpl) OpenView(ctx context.Context, request OpenViewRequest) error {
	body, err := json.Marshal(request)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/views/open", s.baseURL), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := doWithRetry(s.client, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			e.Err = fmt.Sprintf("HTTP 401: %v", err)
		}
		return &e
	default:
		var e ApiError
		if err := json.NewDecoder(resp.Body).Decode(&e); err != nil {
			return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)
		}
		return &e
	}
}

type PachcaClient struct {
	Bots         BotsService
	Chats        ChatsService
	Common       CommonService
	GroupTags    GroupTagsService
	LinkPreviews LinkPreviewsService
	Members      MembersService
	Messages     MessagesService
	Profile      ProfileService
	Reactions    ReactionsService
	ReadMembers  ReadMembersService
	Search       SearchService
	Security     SecurityService
	Tasks        TasksService
	Threads      ThreadsService
	Users        UsersService
	Views        ViewsService
}

type clientConfig struct {
	baseURL string
	bots BotsService
	chats ChatsService
	common CommonService
	groupTags GroupTagsService
	linkPreviews LinkPreviewsService
	members MembersService
	messages MessagesService
	profile ProfileService
	reactions ReactionsService
	readMembers ReadMembersService
	search SearchService
	security SecurityService
	tasks TasksService
	threads ThreadsService
	users UsersService
	views ViewsService
}

type ClientOption func(*clientConfig)

type stubClientConfig struct {
	bots BotsService
	chats ChatsService
	common CommonService
	groupTags GroupTagsService
	linkPreviews LinkPreviewsService
	members MembersService
	messages MessagesService
	profile ProfileService
	reactions ReactionsService
	readMembers ReadMembersService
	search SearchService
	security SecurityService
	tasks TasksService
	threads ThreadsService
	users UsersService
	views ViewsService
}

type StubClientOption func(*stubClientConfig)

const DefaultBaseURL = "https://api.pachca.com/api/shared/v1"

func WithBaseURL(baseURL string) ClientOption {
	return func(cfg *clientConfig) { cfg.baseURL = baseURL }
}

func WithBots(service BotsService) ClientOption {
	return func(cfg *clientConfig) { cfg.bots = service }
}

func WithChats(service ChatsService) ClientOption {
	return func(cfg *clientConfig) { cfg.chats = service }
}

func WithCommon(service CommonService) ClientOption {
	return func(cfg *clientConfig) { cfg.common = service }
}

func WithGroupTags(service GroupTagsService) ClientOption {
	return func(cfg *clientConfig) { cfg.groupTags = service }
}

func WithLinkPreviews(service LinkPreviewsService) ClientOption {
	return func(cfg *clientConfig) { cfg.linkPreviews = service }
}

func WithMembers(service MembersService) ClientOption {
	return func(cfg *clientConfig) { cfg.members = service }
}

func WithMessages(service MessagesService) ClientOption {
	return func(cfg *clientConfig) { cfg.messages = service }
}

func WithProfile(service ProfileService) ClientOption {
	return func(cfg *clientConfig) { cfg.profile = service }
}

func WithReactions(service ReactionsService) ClientOption {
	return func(cfg *clientConfig) { cfg.reactions = service }
}

func WithReadMembers(service ReadMembersService) ClientOption {
	return func(cfg *clientConfig) { cfg.readMembers = service }
}

func WithSearch(service SearchService) ClientOption {
	return func(cfg *clientConfig) { cfg.search = service }
}

func WithSecurity(service SecurityService) ClientOption {
	return func(cfg *clientConfig) { cfg.security = service }
}

func WithTasks(service TasksService) ClientOption {
	return func(cfg *clientConfig) { cfg.tasks = service }
}

func WithThreads(service ThreadsService) ClientOption {
	return func(cfg *clientConfig) { cfg.threads = service }
}

func WithUsers(service UsersService) ClientOption {
	return func(cfg *clientConfig) { cfg.users = service }
}

func WithViews(service ViewsService) ClientOption {
	return func(cfg *clientConfig) { cfg.views = service }
}

func WithStubBots(service BotsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.bots = service }
}

func WithStubChats(service ChatsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.chats = service }
}

func WithStubCommon(service CommonService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.common = service }
}

func WithStubGroupTags(service GroupTagsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.groupTags = service }
}

func WithStubLinkPreviews(service LinkPreviewsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.linkPreviews = service }
}

func WithStubMembers(service MembersService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.members = service }
}

func WithStubMessages(service MessagesService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.messages = service }
}

func WithStubProfile(service ProfileService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.profile = service }
}

func WithStubReactions(service ReactionsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.reactions = service }
}

func WithStubReadMembers(service ReadMembersService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.readMembers = service }
}

func WithStubSearch(service SearchService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.search = service }
}

func WithStubSecurity(service SecurityService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.security = service }
}

func WithStubTasks(service TasksService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.tasks = service }
}

func WithStubThreads(service ThreadsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.threads = service }
}

func WithStubUsers(service UsersService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.users = service }
}

func WithStubViews(service ViewsService) StubClientOption {
	return func(cfg *stubClientConfig) { cfg.views = service }
}

func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {
	cfg := clientConfig{baseURL: DefaultBaseURL}
	for _, opt := range opts {
		opt(&cfg)
	}
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	return &PachcaClient{
		Bots        : func() BotsService { if cfg.bots != nil { return cfg.bots }; return &BotsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Chats       : func() ChatsService { if cfg.chats != nil { return cfg.chats }; return &ChatsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Common      : func() CommonService { if cfg.common != nil { return cfg.common }; return &CommonServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		GroupTags   : func() GroupTagsService { if cfg.groupTags != nil { return cfg.groupTags }; return &GroupTagsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		LinkPreviews: func() LinkPreviewsService { if cfg.linkPreviews != nil { return cfg.linkPreviews }; return &LinkPreviewsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Members     : func() MembersService { if cfg.members != nil { return cfg.members }; return &MembersServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Messages    : func() MessagesService { if cfg.messages != nil { return cfg.messages }; return &MessagesServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Profile     : func() ProfileService { if cfg.profile != nil { return cfg.profile }; return &ProfileServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Reactions   : func() ReactionsService { if cfg.reactions != nil { return cfg.reactions }; return &ReactionsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		ReadMembers : func() ReadMembersService { if cfg.readMembers != nil { return cfg.readMembers }; return &ReadMembersServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Search      : func() SearchService { if cfg.search != nil { return cfg.search }; return &SearchServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Security    : func() SecurityService { if cfg.security != nil { return cfg.security }; return &SecurityServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Tasks       : func() TasksService { if cfg.tasks != nil { return cfg.tasks }; return &TasksServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Threads     : func() ThreadsService { if cfg.threads != nil { return cfg.threads }; return &ThreadsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Users       : func() UsersService { if cfg.users != nil { return cfg.users }; return &UsersServiceImpl{baseURL: cfg.baseURL, client: client} }(),
		Views       : func() ViewsService { if cfg.views != nil { return cfg.views }; return &ViewsServiceImpl{baseURL: cfg.baseURL, client: client} }(),
	}
}

func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {
	cfg := stubClientConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	return &PachcaClient{
		Bots        : func() BotsService { if cfg.bots != nil { return cfg.bots }; return &BotsServiceStub{} }(),
		Chats       : func() ChatsService { if cfg.chats != nil { return cfg.chats }; return &ChatsServiceStub{} }(),
		Common      : func() CommonService { if cfg.common != nil { return cfg.common }; return &CommonServiceStub{} }(),
		GroupTags   : func() GroupTagsService { if cfg.groupTags != nil { return cfg.groupTags }; return &GroupTagsServiceStub{} }(),
		LinkPreviews: func() LinkPreviewsService { if cfg.linkPreviews != nil { return cfg.linkPreviews }; return &LinkPreviewsServiceStub{} }(),
		Members     : func() MembersService { if cfg.members != nil { return cfg.members }; return &MembersServiceStub{} }(),
		Messages    : func() MessagesService { if cfg.messages != nil { return cfg.messages }; return &MessagesServiceStub{} }(),
		Profile     : func() ProfileService { if cfg.profile != nil { return cfg.profile }; return &ProfileServiceStub{} }(),
		Reactions   : func() ReactionsService { if cfg.reactions != nil { return cfg.reactions }; return &ReactionsServiceStub{} }(),
		ReadMembers : func() ReadMembersService { if cfg.readMembers != nil { return cfg.readMembers }; return &ReadMembersServiceStub{} }(),
		Search      : func() SearchService { if cfg.search != nil { return cfg.search }; return &SearchServiceStub{} }(),
		Security    : func() SecurityService { if cfg.security != nil { return cfg.security }; return &SecurityServiceStub{} }(),
		Tasks       : func() TasksService { if cfg.tasks != nil { return cfg.tasks }; return &TasksServiceStub{} }(),
		Threads     : func() ThreadsService { if cfg.threads != nil { return cfg.threads }; return &ThreadsServiceStub{} }(),
		Users       : func() UsersService { if cfg.users != nil { return cfg.users }; return &UsersServiceStub{} }(),
		Views       : func() ViewsService { if cfg.views != nil { return cfg.views }; return &ViewsServiceStub{} }(),
	}
}
