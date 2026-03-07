package pachca

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

type authTransport struct {
	token string
	base  http.RoundTripper
}

func (t *authTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+t.token)
	return t.base.RoundTrip(req)
}

// MembersService handles member operations.
type MembersService struct {
	baseURL string
	client  *http.Client
}

// AddMembers adds members to a chat (D1: unwrapped single-field request).
func (s *MembersService) AddMembers(ctx context.Context, id int32, memberIDs []int32) error {
	reqBody := AddMembersRequest{MemberIDs: memberIDs}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/chats/%d/members", s.baseURL, id), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.client.Do(req)
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

// ChatsService handles chat operations.
type ChatsService struct {
	baseURL string
	client  *http.Client
}

// ArchiveChat archives a chat by ID (D2: void action, no body).
func (s *ChatsService) ArchiveChat(ctx context.Context, id int32) error {
	req, err := http.NewRequestWithContext(ctx, "PUT", fmt.Sprintf("%s/chats/%d/archive", s.baseURL, id), nil)
	if err != nil {
		return err
	}
	resp, err := s.client.Do(req)
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

// CreateChat creates a new chat (D3: 2+ fields, pass as object).
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
	resp, err := s.client.Do(req)
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

// PachcaClient is the main client for the Pachca API.
type PachcaClient struct {
	Chats   *ChatsService
	Members *MembersService
}

// NewPachcaClient creates a new PachcaClient.
func NewPachcaClient(baseURL, token string) *PachcaClient {
	client := &http.Client{
		Transport: &authTransport{token: token, base: http.DefaultTransport},
	}
	return &PachcaClient{
		Chats:   &ChatsService{baseURL: baseURL, client: client},
		Members: &MembersService{baseURL: baseURL, client: client},
	}
}
