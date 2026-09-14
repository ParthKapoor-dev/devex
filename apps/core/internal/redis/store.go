package redis

import (
	"context"
	"core/models"
	"core/pkg/dotenv"
	"errors"
	"fmt"
	log "packages/logging"

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

// Helper Functions

func getUserKey(userId string) string {
	return fmt.Sprintf("user:%s", userId)
}

func getReplKey(replId string) string {
	return fmt.Sprintf("repl:%s", replId)
}

func (r *Redis) CreateRepl(repl *models.Repl) error {

	if err := r.client.HSet(r.ctx, getReplKey(repl.Id), repl).Err(); err != nil {
		return err
	}

	if err := r.client.SAdd(r.ctx, getUserKey(repl.UserId), repl.Id).Err(); err != nil {
		return err
	}

	return nil
}

func (r *Redis) DeleteRepl(replId string) error {
	// Get the repl data to find the username

	var entry models.Repl

	if err := r.client.HGetAll(r.ctx, getReplKey(replId)).Scan(&entry); err != nil {
		return fmt.Errorf("failed to get repl data: %w", err)
	}

	if entry.Id == "" {
		return fmt.Errorf("repl not found: %s", replId)
	}

	// Remove repl from user's set
	if err := r.client.SRem(r.ctx, getUserKey(entry.UserId), replId).Err(); err != nil {
		return fmt.Errorf("failed to remove repl from user set: %w", err)
	}

	// Delete the repl hash
	if err := r.client.Del(r.ctx, getReplKey(replId)).Err(); err != nil {
		return fmt.Errorf("failed to delete repl: %w", err)
	}

	return nil
}

func (r *Redis) GetRepl(replId string) (models.Repl, error) {

	var entry models.Repl

	if err := r.client.HGetAll(r.ctx, "repl:"+replId).Scan(&entry); err != nil {
		return models.Repl{}, err
	}

	if entry.Id == "" {
		return models.Repl{}, errors.New("No such Repl Found")
	}

	repl := models.Repl{
		Id:       replId,
		Name:     entry.Name,
		User:     entry.User,
		UserId:   entry.UserId,
		Template: entry.Template,
		IsActive: entry.IsActive,
	}

	return repl, nil
}

// user-repl relationship
func (r *Redis) CreateUserRepl(userId, replId string) error {
	return r.client.SAdd(r.ctx, getUserKey(userId), replId).Err()
}

func (r *Redis) GetUserRepls(userId string) ([]string, error) {
	return r.client.SMembers(r.ctx, getUserKey(userId)).Result()
}

// Repl Session
func (r *Redis) CreateReplSession(replId string) error {
	return r.client.HSet(r.ctx, getReplKey(replId), "isActive", true).Err()
}

func (r *Redis) DeleteReplSession(replId string) error {
	return r.client.HSet(r.ctx, getReplKey(replId), "isActive", false).Err()
}
