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
	"strconv"
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

const maxRetries = 3

func doWithRetry(client *http.Client, req *http.Request) (*http.Response, error) {
	for attempt := 0; ; attempt++ {
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode == http.StatusTooManyRequests && attempt < maxRetries {
			resp.Body.Close()
			delay := time.Duration(1<<uint(attempt)) * time.Second
			if ra := resp.Header.Get("Retry-After"); ra != "" {
				if secs, err := strconv.Atoi(ra); err == nil {
					delay = time.Duration(secs) * time.Second
				}
			}
			time.Sleep(delay)
			continue
		}
		return resp, nil
	}
}

type SecurityService struct {
	baseURL string
	client  *http.Client
}

func (s *SecurityService) GetAuditEvents(ctx context.Context, params GetAuditEventsParams) (*GetAuditEventsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/audit_events", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	q.Set("start_time", params.StartTime.Format(time.RFC3339))
	q.Set("end_time", params.EndTime.Format(time.RFC3339))
	if params.EventKey != nil {
		q.Set("event_key", string(*params.EventKey))
	}
	if params.ActorID != nil {
		q.Set("actor_id", fmt.Sprintf("%v", *params.ActorID))
	}
	if params.ActorType != nil {
		q.Set("actor_type", fmt.Sprintf("%v", *params.ActorType))
	}
	if params.EntityID != nil {
		q.Set("entity_id", fmt.Sprintf("%v", *params.EntityID))
	}
	if params.EntityType != nil {
		q.Set("entity_type", fmt.Sprintf("%v", *params.EntityType))
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
		var result GetAuditEventsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *SecurityService) GetAuditEventsAll(ctx context.Context, params *GetAuditEventsParams) ([]AuditEvent, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

type BotsService struct {
	baseURL string
	client  *http.Client
}

func (s *BotsService) GetWebhookEvents(ctx context.Context, params *GetWebhookEventsParams) (*GetWebhookEventsResponse, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *BotsService) GetWebhookEventsAll(ctx context.Context, params *GetWebhookEventsParams) ([]WebhookEvent, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

func (s *BotsService) UpdateBot(ctx context.Context, id int32, request BotUpdateRequest) (*BotResponse, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *BotsService) DeleteWebhookEvent(ctx context.Context, id string) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

type ChatsService struct {
	baseURL string
	client  *http.Client
}

func (s *ChatsService) ListChats(ctx context.Context, params *ListChatsParams) (*ListChatsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/chats", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.SortID != nil {
		q.Set("sort[{field}]", string(*params.SortID))
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ChatsService) ListChatsAll(ctx context.Context, params *ListChatsParams) ([]Chat, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

func (s *ChatsService) GetChat(ctx context.Context, id int32) (*Chat, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ChatsService) CreateChat(ctx context.Context, request ChatCreateRequest) (*Chat, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ChatsService) UpdateChat(ctx context.Context, id int32, request ChatUpdateRequest) (*Chat, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ChatsService) ArchiveChat(ctx context.Context, id int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

func (s *ChatsService) UnarchiveChat(ctx context.Context, id int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

type CommonService struct {
	baseURL string
	client  *http.Client
}

func (s *CommonService) DownloadExport(ctx context.Context, id int32) (string, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return "", &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return "", &e
	}
}

func (s *CommonService) ListProperties(ctx context.Context, params ListPropertiesParams) (*ListPropertiesResponse, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *CommonService) RequestExport(ctx context.Context, request ExportRequest) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

func (s *CommonService) UploadFile(ctx context.Context, directUrl string, request FileUploadRequest) error {
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
			return
		}
		if _, err := io.Copy(part, request.File); err != nil {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

func (s *CommonService) GetUploadParams(ctx context.Context) (*UploadParams, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

type MembersService struct {
	baseURL string
	client  *http.Client
}

func (s *MembersService) ListMembers(ctx context.Context, id int32, params *ListMembersParams) (*ListMembersResponse, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *MembersService) ListMembersAll(ctx context.Context, id int32, params *ListMembersParams) ([]User, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

func (s *MembersService) AddTags(ctx context.Context, id int32, groupTagIds []int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

func (s *MembersService) AddMembers(ctx context.Context, id int32, request AddMembersRequest) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

func (s *MembersService) UpdateMemberRole(ctx context.Context, id int32, userId int32, role ChatMemberRole) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

func (s *MembersService) RemoveTag(ctx context.Context, id int32, tagId int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

func (s *MembersService) LeaveChat(ctx context.Context, id int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

func (s *MembersService) RemoveMember(ctx context.Context, id int32, userId int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

type GroupTagsService struct {
	baseURL string
	client  *http.Client
}

func (s *GroupTagsService) ListTags(ctx context.Context, params *ListTagsParams) (*ListTagsResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/group_tags", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	if params != nil && params.Names != nil {
		q.Set("names", fmt.Sprintf("%v", *params.Names))
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *GroupTagsService) ListTagsAll(ctx context.Context, params *ListTagsParams) ([]GroupTag, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

func (s *GroupTagsService) GetTag(ctx context.Context, id int32) (*GroupTag, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *GroupTagsService) GetTagUsers(ctx context.Context, id int32, params *GetTagUsersParams) (*ListMembersResponse, error) {
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
		var result ListMembersResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *GroupTagsService) GetTagUsersAll(ctx context.Context, id int32, params *GetTagUsersParams) ([]User, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

func (s *GroupTagsService) CreateTag(ctx context.Context, request GroupTagRequest) (*GroupTag, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *GroupTagsService) UpdateTag(ctx context.Context, id int32, request GroupTagRequest) (*GroupTag, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *GroupTagsService) DeleteTag(ctx context.Context, id int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

type MessagesService struct {
	baseURL string
	client  *http.Client
}

func (s *MessagesService) ListChatMessages(ctx context.Context, params ListChatMessagesParams) (*ListChatMessagesResponse, error) {
	u, err := url.Parse(fmt.Sprintf("%s/messages", s.baseURL))
	if err != nil {
		return nil, err
	}
	q := u.Query()
	q.Set("chat_id", fmt.Sprintf("%v", params.ChatID))
	if params.SortID != nil {
		q.Set("sort[{field}]", string(*params.SortID))
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *MessagesService) ListChatMessagesAll(ctx context.Context, params *ListChatMessagesParams) ([]Message, error) {
	if params == nil {
		params = &ListChatMessagesParams{}
	}
	var items []Message
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.ListChatMessages(ctx, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

func (s *MessagesService) GetMessage(ctx context.Context, id int32) (*Message, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *MessagesService) CreateMessage(ctx context.Context, request MessageCreateRequest) (*Message, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *MessagesService) PinMessage(ctx context.Context, id int32) error {
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
	case http.StatusCreated:
		return nil
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

func (s *MessagesService) UpdateMessage(ctx context.Context, id int32, request MessageUpdateRequest) (*Message, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *MessagesService) DeleteMessage(ctx context.Context, id int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

func (s *MessagesService) UnpinMessage(ctx context.Context, id int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

type LinkPreviewsService struct {
	baseURL string
	client  *http.Client
}

func (s *LinkPreviewsService) CreateLinkPreviews(ctx context.Context, id int32, request LinkPreviewsRequest) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

type ReactionsService struct {
	baseURL string
	client  *http.Client
}

func (s *ReactionsService) ListReactions(ctx context.Context, id int32, params *ListReactionsParams) (*ListReactionsResponse, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ReactionsService) ListReactionsAll(ctx context.Context, id int32, params *ListReactionsParams) ([]Reaction, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

func (s *ReactionsService) AddReaction(ctx context.Context, id int32, request ReactionRequest) (*Reaction, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ReactionsService) RemoveReaction(ctx context.Context, id int32, params RemoveReactionParams) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

type ReadMembersService struct {
	baseURL string
	client  *http.Client
}

func (s *ReadMembersService) ListReadMembers(ctx context.Context, id int32, params *ListReadMembersParams) (*any, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ReadMembersService) ListReadMembersAll(ctx context.Context, id int32, params *ListReadMembersParams) ([]any, error) {
	if params == nil {
		params = &ListReadMembersParams{}
	}
	var items []any
	var cursor *string
	for {
		params.Cursor = cursor
		result, err := s.ListReadMembers(ctx, id, params)
		if err != nil {
			return nil, err
		}
		items = append(items, result.Data...)
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

type ThreadsService struct {
	baseURL string
	client  *http.Client
}

func (s *ThreadsService) GetThread(ctx context.Context, id int32) (*Thread, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ThreadsService) CreateThread(ctx context.Context, id int32) (*Thread, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

type ProfileService struct {
	baseURL string
	client  *http.Client
}

func (s *ProfileService) GetTokenInfo(ctx context.Context) (*AccessTokenInfo, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ProfileService) GetProfile(ctx context.Context) (*User, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ProfileService) GetStatus(ctx context.Context) (*any, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ProfileService) UpdateStatus(ctx context.Context, request StatusUpdateRequest) (*UserStatus, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *ProfileService) DeleteStatus(ctx context.Context) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

type SearchService struct {
	baseURL string
	client  *http.Client
}

func (s *SearchService) SearchChats(ctx context.Context, params *SearchChatsParams) (*ListChatsResponse, error) {
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
		var result ListChatsResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *SearchService) SearchChatsAll(ctx context.Context, params *SearchChatsParams) ([]Chat, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

func (s *SearchService) SearchMessages(ctx context.Context, params *SearchMessagesParams) (*ListChatMessagesResponse, error) {
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
	if params != nil && params.ChatIDs != nil {
		q.Set("chat_ids", fmt.Sprintf("%v", params.ChatIDs))
	}
	if params != nil && params.UserIDs != nil {
		q.Set("user_ids", fmt.Sprintf("%v", params.UserIDs))
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
		var result ListChatMessagesResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *SearchService) SearchMessagesAll(ctx context.Context, params *SearchMessagesParams) ([]Message, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

func (s *SearchService) SearchUsers(ctx context.Context, params *SearchUsersParams) (*ListMembersResponse, error) {
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
	if params != nil && params.CompanyRoles != nil {
		q.Set("company_roles", fmt.Sprintf("%v", params.CompanyRoles))
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *SearchService) SearchUsersAll(ctx context.Context, params *SearchUsersParams) ([]User, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

type TasksService struct {
	baseURL string
	client  *http.Client
}

func (s *TasksService) ListTasks(ctx context.Context, params *ListTasksParams) (*ListTasksResponse, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *TasksService) ListTasksAll(ctx context.Context, params *ListTasksParams) ([]Task, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

func (s *TasksService) GetTask(ctx context.Context, id int32) (*Task, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *TasksService) CreateTask(ctx context.Context, request TaskCreateRequest) (*Task, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *TasksService) UpdateTask(ctx context.Context, id int32, request TaskUpdateRequest) (*Task, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *TasksService) DeleteTask(ctx context.Context, id int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

type UsersService struct {
	baseURL string
	client  *http.Client
}

func (s *UsersService) ListUsers(ctx context.Context, params *ListUsersParams) (*ListMembersResponse, error) {
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
		var result ListMembersResponse
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		return &result, nil
	case http.StatusUnauthorized:
		var e OAuthError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *UsersService) ListUsersAll(ctx context.Context, params *ListUsersParams) ([]User, error) {
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
		if result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {
			return items, nil
		}
		cursor = result.Meta.Paginate.NextPage
	}
}

func (s *UsersService) GetUser(ctx context.Context, id int32) (*User, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *UsersService) GetUserStatus(ctx context.Context, userId int32) (*any, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *UsersService) CreateUser(ctx context.Context, request UserCreateRequest) (*User, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *UsersService) UpdateUser(ctx context.Context, id int32, request UserUpdateRequest) (*User, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *UsersService) UpdateUserStatus(ctx context.Context, userId int32, request StatusUpdateRequest) (*UserStatus, error) {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return nil, &e
	}
}

func (s *UsersService) DeleteUser(ctx context.Context, id int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

func (s *UsersService) DeleteUserStatus(ctx context.Context, userId int32) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

type ViewsService struct {
	baseURL string
	client  *http.Client
}

func (s *ViewsService) OpenView(ctx context.Context, request OpenViewRequest) error {
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
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	default:
		var e ApiError
		json.NewDecoder(resp.Body).Decode(&e)
		return &e
	}
}

type PachcaClient struct {
	Bots         *BotsService
	Chats        *ChatsService
	Common       *CommonService
	GroupTags    *GroupTagsService
	LinkPreviews *LinkPreviewsService
	Members      *MembersService
	Messages     *MessagesService
	Profile      *ProfileService
	Reactions    *ReactionsService
	ReadMembers  *ReadMembersService
	Search       *SearchService
	Security     *SecurityService
	Tasks        *TasksService
	Threads      *ThreadsService
	Users        *UsersService
	Views        *ViewsService
}

const DefaultBaseURL = "https://api.pachca.com/api/shared/v1"

func NewPachcaClient(token string, baseURL ...string) *PachcaClient {
	url := DefaultBaseURL
	if len(baseURL) > 0 { url = baseURL[0] }
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	return &PachcaClient{
		Bots        : &BotsService{baseURL: url, client: client},
		Chats       : &ChatsService{baseURL: url, client: client},
		Common      : &CommonService{baseURL: url, client: client},
		GroupTags   : &GroupTagsService{baseURL: url, client: client},
		LinkPreviews: &LinkPreviewsService{baseURL: url, client: client},
		Members     : &MembersService{baseURL: url, client: client},
		Messages    : &MessagesService{baseURL: url, client: client},
		Profile     : &ProfileService{baseURL: url, client: client},
		Reactions   : &ReactionsService{baseURL: url, client: client},
		ReadMembers : &ReadMembersService{baseURL: url, client: client},
		Search      : &SearchService{baseURL: url, client: client},
		Security    : &SecurityService{baseURL: url, client: client},
		Tasks       : &TasksService{baseURL: url, client: client},
		Threads     : &ThreadsService{baseURL: url, client: client},
		Users       : &UsersService{baseURL: url, client: client},
		Views       : &ViewsService{baseURL: url, client: client},
	}
}
