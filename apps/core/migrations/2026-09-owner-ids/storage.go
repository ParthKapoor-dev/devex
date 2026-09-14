package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// storage is the part of the bucket the migration needs. Keys are full object
// keys, e.g. repl/alice/repl-1/index.js.
type storage interface {
	List(ctx context.Context, prefix string) ([]string, error)
	Copy(ctx context.Context, srcKey, dstKey string) error
	Delete(ctx context.Context, key string) error
}

type s3Storage struct {
	client *s3.Client
	bucket string
}

func newS3Storage(ctx context.Context, endpoint, bucket, region, accessKey, secretKey string) (*s3Storage, error) {
	if accessKey == "" || secretKey == "" {
		return nil, errors.New("S3_ACCESS_KEY and S3_SECRET_KEY must be set in the environment")
	}
	client := s3.New(s3.Options{
		Region:       region,
		BaseEndpoint: aws.String(endpoint),
		UsePathStyle: true,
		Credentials:  credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
	})
	if _, err := client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: aws.String(bucket)}); err != nil {
		return nil, fmt.Errorf("bucket %s: %w", bucket, err)
	}
	return &s3Storage{client: client, bucket: bucket}, nil
}

func (s *s3Storage) List(ctx context.Context, prefix string) ([]string, error) {
	var keys []string
	p := s3.NewListObjectsV2Paginator(s.client, &s3.ListObjectsV2Input{Bucket: aws.String(s.bucket), Prefix: aws.String(prefix)})
	for p.HasMorePages() {
		page, err := p.NextPage(ctx)
		if err != nil {
			return nil, fmt.Errorf("list %s: %w", prefix, err)
		}
		for _, obj := range page.Contents {
			keys = append(keys, aws.ToString(obj.Key))
		}
	}
	return keys, nil
}

func (s *s3Storage) Copy(ctx context.Context, srcKey, dstKey string) error {
	// CopySource is "bucket/key", URL-encoded. Ids contain ':', and file names
	// can contain anything, so escape each path segment.
	segments := strings.Split(s.bucket+"/"+srcKey, "/")
	for i, seg := range segments {
		segments[i] = url.PathEscape(seg)
	}
	_, err := s.client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(s.bucket),
		CopySource: aws.String(strings.Join(segments, "/")),
		Key:        aws.String(dstKey),
	})
	if err != nil {
		return fmt.Errorf("copy %s -> %s: %w", srcKey, dstKey, err)
	}
	return nil
}

func (s *s3Storage) Delete(ctx context.Context, key string) error {
	if _, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(key)}); err != nil {
		return fmt.Errorf("delete %s: %w", key, err)
	}
	return nil
}

// githubLookup returns the numeric id of a GitHub login, or found=false if no
// such account exists. plan uses it only to suggest a value; a person decides.
type githubLookup func(ctx context.Context, login string) (id int64, found bool, err error)

func newGitHubLookup(client *http.Client, baseURL, token string) githubLookup {
	return func(ctx context.Context, login string) (int64, bool, error) {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, strings.TrimRight(baseURL, "/")+"/users/"+url.PathEscape(login), nil)
		if err != nil {
			return 0, false, err
		}
		req.Header.Set("Accept", "application/vnd.github+json")
		req.Header.Set("User-Agent", "devex-migrate-owner-ids")
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		resp, err := client.Do(req)
		if err != nil {
			return 0, false, err
		}
		defer resp.Body.Close()

		switch resp.StatusCode {
		case http.StatusOK:
			var body struct {
				ID int64 `json:"id"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
				return 0, false, err
			}
			return body.ID, true, nil
		case http.StatusNotFound:
			return 0, false, nil
		default:
			return 0, false, fmt.Errorf("GitHub API: %s", resp.Status)
		}
	}
}
