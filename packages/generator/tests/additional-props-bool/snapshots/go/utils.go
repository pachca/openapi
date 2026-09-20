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
		if retryable5xx[resp.StatusCode] && attempt < maxRetries {
			resp.Body.Close()
			delay := jitter(10 * time.Duration(1<<uint(attempt)) * time.Second)
			time.Sleep(delay)
			continue
		}
		return resp, nil
	}
}
