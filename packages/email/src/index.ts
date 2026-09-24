import { env } from "@workspace/env"
import { Resend } from "resend"

function resendClient() {
  return new Resend(env.RESEND_API_KEY)
}

export class Email {
  static async send(to: string, subject: string, text: string, html?: string) {
    await resendClient().emails.send({
      from: env.RESEND_EMAIL_FROM,
      to,
      subject,
      text,
      html,
    })
  }
}
