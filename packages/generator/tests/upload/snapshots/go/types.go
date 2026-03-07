package pachca

import "io"

// FileUploadRequest represents a file upload request.
type FileUploadRequest struct {
	ContentDisposition *string
	ACL                *string
	Policy             *string
	XAmzCredential     *string
	XAmzAlgorithm      *string
	XAmzDate           *string
	XAmzSignature      *string
	Key                string
	File               io.Reader
}

// OAuthError represents an OAuth error.
type OAuthError struct {
	Err *string `json:"error,omitempty"`
}

func (e *OAuthError) Error() string {
	if e.Err != nil {
		return *e.Err
	}
	return "oauth error"
}
