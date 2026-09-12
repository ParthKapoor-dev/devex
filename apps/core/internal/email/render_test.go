package email

import (
	"strings"
	"testing"
	"time"
)

// The magic-link mail is rendered with text/template specifically so that MSO
// conditional comments survive. This test fails loudly if someone switches it
// back to html/template, which strips them without erroring.
func TestMagicLinkKeepsOutlookConditionals(t *testing.T) {
	msg, err := GenerateMagicLink("dev@example.com", "abc123")
	if err != nil {
		t.Fatalf("GenerateMagicLink: %v", err)
	}

	for _, want := range []string{
		"<!--[if mso]>",        // ghost table + VML button wrapper
		"v:roundrect",          // bulletproof Outlook button
		"prefers-color-scheme", // dark mode for Apple/Outlook.com
		"data-ogsc",            // dark mode for the Outlook mobile apps
		"token=abc123",         // the actual link
		"15 minutes",           // expiry copy, derived from TokenLifetime
	} {
		if !strings.Contains(msg.HTML, want) {
			t.Errorf("HTML is missing %q", want)
		}
	}

	if !strings.Contains(msg.Text, "token=abc123") {
		t.Error("text/plain part is missing the magic link")
	}
	if msg.Subject == "" {
		t.Error("subject is empty")
	}
}

// Effects that silently break in Gmail and classic Outlook must stay out of
// the template.
func TestMagicLinkAvoidsUnsupportedCSS(t *testing.T) {
	msg, err := GenerateMagicLink("dev@example.com", "tok")
	if err != nil {
		t.Fatalf("GenerateMagicLink: %v", err)
	}

	for _, banned := range []string{
		"backdrop-filter",
		"linear-gradient",
		"display:flex",
		"display: flex",
	} {
		if strings.Contains(msg.HTML, banned) {
			t.Errorf("HTML uses %q, which does not render in Gmail/Outlook", banned)
		}
	}
}

func TestMagicLinkEscapesRecipient(t *testing.T) {
	msg, err := GenerateMagicLink(`a"><script>alert(1)</script>@example.com`, "tok")
	if err != nil {
		t.Fatalf("GenerateMagicLink: %v", err)
	}
	if strings.Contains(msg.HTML, "<script>") {
		t.Error("recipient was interpolated without escaping")
	}
}

func TestHumanDuration(t *testing.T) {
	cases := map[string]string{
		"15m": "15 minutes",
		"1m":  "1 minute",
		"2h":  "2 hours",
	}
	for input, want := range cases {
		d := mustParseDuration(t, input)
		if got := humanDuration(d); got != want {
			t.Errorf("humanDuration(%s) = %q, want %q", input, got, want)
		}
	}
}

func mustParseDuration(t *testing.T, s string) time.Duration {
	t.Helper()
	d, err := time.ParseDuration(s)
	if err != nil {
		t.Fatalf("bad duration %q: %v", s, err)
	}
	return d
}
