package models

import (
	"time"

	"golang.org/x/oauth2"
)

type User struct {
	Id        string    `json:"id"`
	Login     string    `json:"login"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	AvatarURL string    `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
}

type Session struct {
	UserID       int64     `json:"user_id"`
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	TokenExpiry  time.Time `json:"token_expiry"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type TokenInfo struct {
	Token     *oauth2.Token `json:"token"`
	User      *User         `json:"user"`
	ExpiresAt time.Time     `json:"expires_at"`
}
