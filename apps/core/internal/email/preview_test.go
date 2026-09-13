package email

import (
	"os"
	"path/filepath"
	"testing"
)

// Writes a rendered sample of the magic-link email so it can be opened in a
// browser or dropped into Litmus/Email-on-Acid.
//
//	go test ./internal/email/ -run TestWriteEmailPreview -preview-dir=/tmp
func TestWriteEmailPreview(t *testing.T) {
	dir := os.Getenv("EMAIL_PREVIEW_DIR")
	if dir == "" {
		t.Skip("set EMAIL_PREVIEW_DIR to write a preview")
	}

	msg, err := GenerateMagicLink("you@example.com", "demo-token-1234567890")
	if err != nil {
		t.Fatalf("GenerateMagicLink: %v", err)
	}

	htmlPath := filepath.Join(dir, "devex-magiclink.html")
	textPath := filepath.Join(dir, "devex-magiclink.txt")

	if err := os.WriteFile(htmlPath, []byte(msg.HTML), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(textPath, []byte(msg.Text), 0o644); err != nil {
		t.Fatal(err)
	}

	t.Logf("subject: %s", msg.Subject)
	t.Logf("html:    %s (%d bytes)", htmlPath, len(msg.HTML))
	t.Logf("text:    %s (%d bytes)", textPath, len(msg.Text))
}
