package resend

import (
	"core/pkg/dotenv"

	"github.com/resend/resend-go/v2"
)

type Resend struct {
	client *resend.Client
}

// SendEmail delivers a multipart message.
//
// `text` is the text/plain alternative. Always send one: clients that can't or
// won't render HTML fall back to it, and spam filters penalise HTML-only mail.
func (r *Resend) SendEmail(email, subject, htmlBody, text string) error {

	params := &resend.SendEmailRequest{
		From:    dotenv.EnvString("EMAIL_FROM", "DevEx <no-reply@devx.parthkapoor.me>"),
		To:      []string{email},
		Subject: subject,
		Html:    htmlBody,
		Text:    text,
	}

	_, err := r.client.Emails.Send(params)
	return err
}

func NewClient() *Resend {
	return &Resend{
		client: resend.NewClient(dotenv.EnvString("RESEND_API_KEY", "")),
	}
}
