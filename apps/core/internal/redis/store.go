package redis

import (
	"context"
	"errors"
	"fmt"
	log "packages/logging"
	"core/models"
	"core/pkg/dotenv"

	"github.com/redis/go-redis/v9"
)

type Redis struct {
	client *redis.Client
	ctx    context.Context
}

var REDIS_URL = dotenv.EnvString("REDIS_URL", "")

func NewRedisStore() *Redis {

	ctx := context.Background()
	opt, _ := redis.ParseURL(REDIS_URL)
	client := redis.NewClient(opt)

	_, err := client.Ping(ctx).Result()
	if err != nil {
		log.Error("Failed to connect to Redis", "error", err)
	}

	log.Info("Connected to Redis")

	return &Redis{
		client: client,
		ctx:    ctx,
	}
}

// Ping Redis (Health Check)
func (r *Redis) Ping() error {
	_, err := r.client.Ping(r.ctx).Result()
	return err
}

// Helper Functinos
func (r *Redis) CreateRepl(template, username, replName, replId string) error {
	if err := r.client.HSet(r.ctx, "repl:"+replId, map[string]string{
		"id":       replId,
		"name":     replName,
		"user":     username,
		"template": template,
		"isActive": "false",
	}).Err(); err != nil {
		return err
	}

	if err := r.client.SAdd(r.ctx, "user:"+username, replId).Err(); err != nil {
		return err
	}

	return nil
}

func (r *Redis) DeleteRepl(replId string) error {
	// Get the repl data to find the username
	replData, err := r.client.HGetAll(r.ctx, "repl:"+replId).Result()
	if err != nil {
		return fmt.Errorf("failed to get repl data: %w", err)
	}

	if len(replData) == 0 {
		return fmt.Errorf("repl not found: %s", replId)
	}

	username := replData["user"]
	if username == "" {
		return fmt.Errorf("no user found for repl: %s", replId)
	}

	// Remove repl from user's set
	if err := r.client.SRem(r.ctx, "user:"+username, replId).Err(); err != nil {
		return fmt.Errorf("failed to remove repl from user set: %w", err)
	}

	// Delete the repl hash
	if err := r.client.Del(r.ctx, "repl:"+replId).Err(); err != nil {
		return fmt.Errorf("failed to delete repl: %w", err)
	}

	return nil
}

func (r *Redis) GetRepl(replId string) (models.Repl, error) {

	data, err := r.client.HGetAll(r.ctx, "repl:"+replId).Result()
	if err != nil {
		return models.Repl{}, err
	}

	if len(data) == 0 {
		return models.Repl{}, errors.New("No such Repl Found")
	}

	repl := models.Repl{
		Id:       replId,
		Name:     data["name"],
		User:     data["user"],
		Template: data["template"],
		IsActive: data["isActive"] == "true",
	}

	return repl, nil
}

// user-repl relationship
func (r *Redis) CreateUserRepl(username, replId string) error {
	return r.client.SAdd(r.ctx, "user:"+username, replId).Err()
}

func (r *Redis) GetUserRepls(username string) ([]string, error) {
	return r.client.SMembers(r.ctx, "user:"+username).Result()
}

// Repl Session
func (r *Redis) CreateReplSession(replId string) error {
	return r.client.HSet(r.ctx, "repl:"+replId, "isActive", "true").Err()
}

func (r *Redis) DeleteReplSession(replId string) error {
	return r.client.HSet(r.ctx, "repl:"+replId, "isActive", "false").Err()
}
