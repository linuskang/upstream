import { Resend } from "resend"
import { env } from "@workspace/env"

function ResendClient() {
  return new Resend(env.RESEND_API_KEY)
}

export class Email {
  static async send(to: string, subject: string, text: string, html?: string) {
    await ResendClient().emails.send({
      from: env.RESEND_EMAIL_FROM,
      to,
      subject,
      text,
      html,
    })
  }
}
