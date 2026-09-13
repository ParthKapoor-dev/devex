package repl

import "core/models"

type newReplRequest struct {
	UserName string `json:"userName"`
	Template string `json:"template"`
	ReplName string `json:"replName"`
}

// replStore is the part of *redis.Redis the handlers use.
type replStore interface {
	CreateRepl(template, username, replName, replId string) error
	DeleteRepl(replId string) error
	GetRepl(replId string) (models.Repl, error)
	GetUserRepls(username string) ([]string, error)
	CreateReplSession(replId string) error
	DeleteReplSession(replId string) error
}

// replStorage is the part of *s3.S3Client the handlers use.
type replStorage interface {
	CopyFolder(sourcePrefix, destinationPrefix string) error
	DeleteFolder(folderPrefix string) error
}
