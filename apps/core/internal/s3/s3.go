package s3

import (
	"context"
	"fmt"
	log "packages/logging"
	"path"
	"strings"

	"core/pkg/dotenv"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	_ "github.com/joho/godotenv/autoload"
)

var (
	accessKey = dotenv.EnvString("S3_ACCESS_KEY", "YOUR_S3_ACCESS_KEY")
	secretKey = dotenv.EnvString("S3_SECRET_KEY", "YOUR_S3_SECRET_KEY")
	region    = dotenv.EnvString("S3_REGION", "auto")
	bucket    = dotenv.EnvString("S3_BUCKET", "devex")
	endpoint  = dotenv.EnvString("S3_ENDPOINT", "https://<account_id>.r2.cloudflarestorage.com")
)

type S3Client struct {
	client *s3.Client
	ctx    context.Context
}

func NewS3Client() *S3Client {
	ctx := context.TODO()

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		log.Error("Load S3 config failed", "error", err)
	}

	s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
	})

	return &S3Client{
		client: s3Client,
		ctx:    ctx,
	}
}

// To Ping the S3 Connection
func (s *S3Client) Ping() error {
	input := &s3.HeadBucketInput{
		Bucket: aws.String(bucket),
	}

	_, err := s.client.HeadBucket(s.ctx, input)
	if err != nil {
		return fmt.Errorf("S3 ping failed: %w", err)
	}
	return nil
}

func (s *S3Client) CopyFolder(sourcePrefix, destinationPrefix string) error {
	var continuationToken *string

	for {
		// Step 1: List objects
		listInput := &s3.ListObjectsV2Input{
			Bucket:            aws.String(bucket),
			Prefix:            aws.String(sourcePrefix),
			ContinuationToken: continuationToken,
		}

		output, err := s.client.ListObjectsV2(s.ctx, listInput)
		if err != nil {
			return fmt.Errorf("❌ Failed to list objects: %w", err)
		}

		if len(output.Contents) == 0 {
			log.Warn("No objects found under prefix", "bucket", bucket, "prefix", sourcePrefix)
			break
		}

		// Step 2: Copy each object
		for _, obj := range output.Contents {
			sourceKey := *obj.Key

			// 🔒 Skip folder placeholders like "base/lang/"
			if strings.HasSuffix(sourceKey, "/") {
				continue
			}

			// Derive destination key
			relativeKey := strings.TrimPrefix(sourceKey, sourcePrefix)
			destinationKey := path.Join(destinationPrefix, relativeKey)

			// Fix: Use simple bucket/key format for S3/R2
			copySource := bucket + "/" + sourceKey

			copyInput := &s3.CopyObjectInput{
				Bucket:     aws.String(bucket),
				CopySource: aws.String(copySource),
				Key:        aws.String(destinationKey),
				// Remove ACL for S3/R2 compatibility if not needed
			}

			_, err := s.client.CopyObject(s.ctx, copyInput)
			if err != nil {
				log.Error("Copy object failed", "bucket", bucket, "source_key", sourceKey, "dest_key", destinationKey, "error", err)
				continue
			}

			log.Info("Copied object", "bucket", bucket, "source_key", sourceKey, "dest_key", destinationKey)
		}

		// Step 3: Handle pagination
		if output.IsTruncated != nil && *output.IsTruncated {
			continuationToken = output.NextContinuationToken
		} else {
			break
		}
	}

	return nil
}

func (s *S3Client) ListObjects(prefix string) error {
	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(prefix),
	}

	resp, err := s.client.ListObjectsV2(s.ctx, input)
	if err != nil {
		return fmt.Errorf("failed to list objects: %w", err)
	}

	if len(resp.Contents) == 0 {
		log.Info("No objects found with prefix", "bucket", bucket, "prefix", prefix)
		return nil
	}

	log.Info("Objects found under prefix", "bucket", bucket, "prefix", prefix)
	for _, object := range resp.Contents {
		log.Info("Object found", "bucket", bucket, "object_key", *object.Key)
	}

	return nil
}

func (s *S3Client) DeleteFolder(folderPrefix string) error {
	var continuationToken *string

	for {
		// Step 1: List objects under the folder prefix
		listInput := &s3.ListObjectsV2Input{
			Bucket:            aws.String(bucket),
			Prefix:            aws.String(folderPrefix),
			ContinuationToken: continuationToken,
		}

		output, err := s.client.ListObjectsV2(s.ctx, listInput)
		if err != nil {
			return fmt.Errorf("❌ Failed to list objects: %w", err)
		}

		if len(output.Contents) == 0 && continuationToken == nil {
			log.Warn("No objects found under prefix", "bucket", bucket, "prefix", folderPrefix)
			return nil
		}

		// Step 2: Delete each object
		for _, obj := range output.Contents {
			deleteInput := &s3.DeleteObjectInput{
				Bucket: aws.String(bucket),
				Key:    obj.Key,
			}

			_, err := s.client.DeleteObject(s.ctx, deleteInput)
			if err != nil {
				log.Error("Delete object failed", "bucket", bucket, "object_key", *obj.Key, "error", err)
				continue
			}

			log.Info("Deleted object", "bucket", bucket, "object_key", *obj.Key)
		}

		// Step 3: Handle pagination
		if output.IsTruncated != nil && *output.IsTruncated {
			continuationToken = output.NextContinuationToken
		} else {
			break
		}
	}

	return nil
}
