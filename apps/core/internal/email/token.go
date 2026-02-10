package email

import (
	"fmt"
	log "packages/logging"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TODO: Load this from env
var jwtSecretKey = []byte("your-super-secret-key-that-is-long-and-secure")

type MagicLinkClaims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}

func GenerateToken(email string) (string, error) {

	expirationTime := time.Now().Add(15 * time.Minute)

	// Create the claims for the token.
	claims := &MagicLinkClaims{
		Email: email,
		RegisteredClaims: jwt.RegisteredClaims{
			// Set the expiration time in Unix format.
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			// You can also add other standard claims like IssuedAt, NotBefore, etc.
			IssuedAt: jwt.NewNumericDate(time.Now()),
			Issuer:   "your-app-name", // Optional: identifies the issuer of the token
		},
	}

	// Create a new token object, specifying the signing method (HS256) and the claims.
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with our secret key to generate the final token string.
	tokenString, err := token.SignedString(jwtSecretKey)
	if err != nil {
		// If there's an error during signing, log it and return.
		log.Error("Sign token failed", "error", err)
		return "", err
	}

	return tokenString, nil
}

func ValidateToken(tokenString string) (string, error) {
	// Parse the token with our custom claims struct.
	// The key function provides the secret key for verification.
	token, err := jwt.ParseWithClaims(tokenString, &MagicLinkClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the signing algorithm is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecretKey, nil
	})

	if err != nil {
		// This will catch various errors, including:
		// - Token is expired (jwt.ErrTokenExpired)
		// - Signature is invalid
		// - Token is malformed
		log.Warn("Parse or validate token failed", "error", err)
		return "", err
	}

	// Check if the token is valid and extract the claims.
	if claims, ok := token.Claims.(*MagicLinkClaims); ok && token.Valid {
		// Token is valid, return the email.
		return claims.Email, nil
	}

	// This case should ideally not be reached if the parsing above handles errors correctly,
	// but it's good practice to have a fallback.
	return "", fmt.Errorf("invalid token")
}
