package pachca

import (
	"bytes"
	"encoding/json"
	"io"
	"math/rand"
	"net/http"
	"strconv"
	"time"
)

// Ptr returns a pointer to the given value.
func Ptr[T any](v T) *T {
	return &v
}

// NotImplementedError is returned by stub methods that have not been implemented.
type NotImplementedError struct {
	Method string
}

func (e NotImplementedError) Error() string {
	return e.Method + " is not implemented"
}

const maxRetries = 3

var retryable5xx = map[int]bool{500: true, 502: true, 503: true, 504: true}

// isIdempotent reports whether a request is safe to repeat after a 5xx. A 5xx
// says nothing about whether the server already applied the request: a
// retried POST or PATCH could apply twice, POST /messages would send the
// message again, and the API has no idempotency key. 429 is safe for any
// method: the request was rejected before it was processed.
func isIdempotent(method string) bool {
	switch method {
	case "", http.MethodGet, http.MethodHead, http.MethodOptions, http.MethodPut, http.MethodDelete:
		return true
	}
	return false
}

// isQueryTimeout reports whether a 504 carries the error code "timeout": the
// server stopped a search because the query is too heavy, and the same query
// would time out again, so it goes back to the caller at once. A 504 from a
// proxy has no such code and is retried. The body is put back for the caller.
func isQueryTimeout(resp *http.Response) bool {
	if resp.StatusCode != http.StatusGatewayTimeout {
		return false
	}
	body, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	resp.Body = io.NopCloser(bytes.NewReader(body))
	if err != nil {
		return false
	}
	var parsed struct {
		Errors []struct {
			Code string `json:"code"`
		} `json:"errors"`
	}
	if json.Unmarshal(body, &parsed) != nil {
		return false
	}
	for _, e := range parsed.Errors {
		if e.Code == "timeout" {
			return true
		}
	}
	return false
}

// Retry-After is a minimum, not an estimate: waiting less lands the retry
// inside a window that is still closed. Jitter only upwards.
func jitter(d time.Duration) time.Duration {
	return time.Duration(float64(d) * (1 + rand.Float64()*0.25))
}

// Only the daily chat limit and the hour-long ban wait longer than a minute.
const maxRetryAfter = 60 * time.Second

func doWithRetry(client *http.Client, req *http.Request) (*http.Response, error) {
	for attempt := 0; ; attempt++ {
		if attempt > 0 && req.GetBody != nil {
			req.Body, _ = req.GetBody()
		}
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode == http.StatusTooManyRequests && attempt < maxRetries {
			delay := time.Duration(1<<uint(attempt)) * time.Second
			if ra := resp.Header.Get("Retry-After"); ra != "" {
				if secs, err := strconv.Atoi(ra); err == nil {
					// A long pause is the daily chat limit or an hour-long ban. Retrying
					// it is pointless, and an early retry doubles the pause: hand the
					// response back so the caller can schedule the work itself.
					if time.Duration(secs)*time.Second > maxRetryAfter {
						return resp, nil
					}
					delay = time.Duration(secs) * time.Second
				}
			}
			resp.Body.Close()
			time.Sleep(jitter(delay))
			continue
		}
		if retryable5xx[resp.StatusCode] && isIdempotent(req.Method) && attempt < maxRetries && !isQueryTimeout(resp) {
			resp.Body.Close()
			delay := jitter(10 * time.Duration(1<<uint(attempt)) * time.Second)
			time.Sleep(delay)
			continue
		}
		return resp, nil
	}
}
