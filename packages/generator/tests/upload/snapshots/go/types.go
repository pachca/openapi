package pachca

import (
	"io"
)

type FileUploadRequest struct {
	Key                string    `json:"key"`
	File               io.Reader `json:"file"`
	ContentDisposition *string   `json:"content-disposition,omitempty"`
	ACL                *string   `json:"acl,omitempty"`
	Policy             *string   `json:"policy,omitempty"`
	XAMZCredential     *string   `json:"x-amz-credential,omitempty"`
	XAMZAlgorithm      *string   `json:"x-amz-algorithm,omitempty"`
	XAMZDate           *string   `json:"x-amz-date,omitempty"`
	XAMZSignature      *string   `json:"x-amz-signature,omitempty"`
}

type OAuthError struct {
	Err *string `json:"error,omitempty"`
}

func (e *OAuthError) Error() string {
	if e.Err != nil {
		return *e.Err
	}
	return "oauth error"
}
