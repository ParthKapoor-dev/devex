package email

import (
	"crypto/rand"
	"crypto/rsa"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestTokenRoundTrip(t *testing.T) {
	token, err := GenerateToken("dev@example.com")
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}

	got, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken: %v", err)
	}
	if got != "dev@example.com" {
		t.Errorf("ValidateToken = %q, want dev@example.com", got)
	}
}

func TestValidateTokenRejects(t *testing.T) {
	valid, err := GenerateToken("dev@example.com")
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}

	claims := func(expires time.Time) *MagicLinkClaims {
		return &MagicLinkClaims{
			Email: "dev@example.com",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(expires),
				IssuedAt:  jwt.NewNumericDate(expires.Add(-TokenLifetime)),
			},
		}
	}
	future := time.Now().Add(TokenLifetime)

	expired, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims(time.Now().Add(-time.Minute))).SignedString(jwtSecretKey)
	if err != nil {
		t.Fatal(err)
	}

	otherKey, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims(future)).SignedString([]byte("a-different-signing-key-for-tests"))
	if err != nil {
		t.Fatal(err)
	}

	unsigned, err := jwt.NewWithClaims(jwt.SigningMethodNone, claims(future)).SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatal(err)
	}

	rsaKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	rs256, err := jwt.NewWithClaims(jwt.SigningMethodRS256, claims(future)).SignedString(rsaKey)
	if err != nil {
		t.Fatal(err)
	}

	// Swap the payload for one naming another address, keeping the signature.
	unsignedOther, err := jwt.NewWithClaims(jwt.SigningMethodHS256, &MagicLinkClaims{
		Email:            "someone-else@example.com",
		RegisteredClaims: jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(future)},
	}).SigningString()
	if err != nil {
		t.Fatal(err)
	}
	tampered := unsignedOther + "." + valid[strings.LastIndex(valid, ".")+1:]

	cases := map[string]string{
		"expired":          expired,
		"different key":    otherKey,
		"alg none":         unsigned,
		"non-HMAC (RS256)": rs256,
		"tampered payload": tampered,
		"garbage":          "not-a-jwt",
		"empty":            "",
	}
	for name, token := range cases {
		t.Run(name, func(t *testing.T) {
			got, err := ValidateToken(token)
			if err == nil {
				t.Fatalf("ValidateToken accepted the token and returned %q", got)
			}
			if got != "" {
				t.Errorf("ValidateToken returned email %q alongside an error", got)
			}
		})
	}
}

func TestValidateEmail(t *testing.T) {
	cases := []struct {
		email   string
		wantErr bool
	}{
		{"dev@example.com", false},
		{"  dev@example.com  ", false},
		{"Dev Example <dev@example.com>", false},
		{"", true},
		{"   ", true},
		{"not-an-email", true},
		{"dev@", true},
	}
	for _, tc := range cases {
		err := ValidateEmail(tc.email)
		if (err != nil) != tc.wantErr {
			t.Errorf("ValidateEmail(%q) err = %v, wantErr %v", tc.email, err, tc.wantErr)
		}
	}
}

func TestExtractNameFromEmail(t *testing.T) {
	cases := map[string]string{
		"dev@example.com":  "dev",
		"first.last@x.org": "first.last",
		"no-at-sign":       "no-at-sign",
		"":                 "",
	}
	for input, want := range cases {
		if got := ExtractNameFromEmail(input); got != want {
			t.Errorf("ExtractNameFromEmail(%q) = %q, want %q", input, got, want)
		}
	}
}
