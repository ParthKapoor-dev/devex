package email

import (
	"embed"
	"fmt"
	"html"
	"net/url"
	"strings"
	"text/template"
	"time"
)

//go:embed templates/*.tmpl
var templateFS embed.FS

// Templates are parsed with text/template, NOT html/template, on purpose.
//
// html/template strips every HTML comment from its output. The magic-link
// template depends on MSO conditional comments (<!--[if mso]>) for the
// bulletproof VML button and the Outlook ghost tables — under html/template
// those disappear silently, with no error, and the button breaks in Outlook.
//
// The cost of that choice is that we own escaping. Every field on
// magicLinkData is escaped at construction time in newMagicLinkData; nothing
// else may be added to the template without the same treatment.
var magicLinkTemplates = template.Must(
	template.ParseFS(templateFS, "templates/magiclink.*.tmpl"),
)

// magicLinkData holds pre-escaped values ready for direct interpolation.
type magicLinkData struct {
	// MagicLink is a URL built with net/url and then HTML-escaped. It appears
	// both in an href and as visible text.
	MagicLink string
	// Recipient is the HTML-escaped destination address.
	Recipient string
	// ExpiryText is a human phrase such as "15 minutes".
	ExpiryText string
	Year       int
}

func newMagicLinkData(recipient, magicLink string) magicLinkData {
	return magicLinkData{
		MagicLink:  html.EscapeString(magicLink),
		Recipient:  html.EscapeString(recipient),
		ExpiryText: humanDuration(TokenLifetime),
		Year:       time.Now().Year(),
	}
}

// humanDuration renders a duration the way a person would say it.
func humanDuration(d time.Duration) string {
	switch {
	case d >= time.Hour:
		h := int(d.Hours())
		return pluralize(h, "hour")
	case d >= time.Minute:
		m := int(d.Minutes())
		return pluralize(m, "minute")
	default:
		return pluralize(int(d.Seconds()), "second")
	}
}

func pluralize(n int, unit string) string {
	if n == 1 {
		return "1 " + unit
	}
	return fmt.Sprintf("%d %ss", n, unit)
}

// buildMagicLinkURL assembles the verification URL with proper query escaping.
func buildMagicLinkURL(base, token string) (string, error) {
	u, err := url.Parse(base)
	if err != nil {
		return "", fmt.Errorf("parse magic link base URL: %w", err)
	}
	q := u.Query()
	q.Set("token", token)
	u.RawQuery = q.Encode()
	return u.String(), nil
}

func renderMagicLink(name string, data magicLinkData) (string, error) {
	var sb strings.Builder
	if err := magicLinkTemplates.ExecuteTemplate(&sb, name, data); err != nil {
		return "", fmt.Errorf("render %s: %w", name, err)
	}
	return sb.String(), nil
}
