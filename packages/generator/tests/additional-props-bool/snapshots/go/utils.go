package pachca

import (
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

func addJitter(delay time.Duration) time.Duration {
	factor := 0.5 + rand.Float64()*0.5
	return time.Duration(float64(delay) * factor)
}

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
			resp.Body.Close()
			delay := time.Duration(1<<uint(attempt)) * time.Second
			if ra := resp.Header.Get("Retry-After"); ra != "" {
				if secs, err := strconv.Atoi(ra); err == nil {
					delay = time.Duration(secs) * time.Second
				}
			}
			time.Sleep(addJitter(delay))
			continue
		}
		if retryable5xx[resp.StatusCode] && attempt < maxRetries {
			resp.Body.Close()
			delay := time.Duration(attempt+1) * time.Second
			time.Sleep(addJitter(delay))
			continue
		}
		return resp, nil
	}
}
