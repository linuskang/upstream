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

  static async sendEmailChangeApproval(
    currentEmail: string,
    newEmail: string,
    token: string
  ) {
    const url = `${env.BASE_URL}/api/email-change/verify?token=${token}`

    await Email.send(
      currentEmail,
      "Approve your email change",
      `We received a request to change your Upstream email address to ${newEmail}. Approve this change by clicking the following link: ${url}`,
      `<div style="font-family: Arial, sans-serif; color: #0f172a;">
          <p>We received a request to change the email address on your Upstream account to <strong>${newEmail}</strong>.</p>
          <p>
            <a href="${url}" style="display: inline-block; padding: 10px 16px; border-radius: 6px; background-color: #0f172a; color: #ffffff; text-decoration: none;">
              Approve email change
            </a>
          </p>
          <p style="font-size: 12px; color: #64748b;">
            If the button doesn't work, copy and paste this URL into your browser:<br />
            ${url}
          </p>
          <p style="font-size: 12px; color: #64748b;">
            If you didn't request this change, you can ignore this email — your email address will stay the same.
          </p>
        </div>`
    )
  }

  static async sendEmailChangeVerification(newEmail: string, token: string) {
    const url = `${env.BASE_URL}/api/email-change/verify?token=${token}`

    await Email.send(
      newEmail,
      "Verify your new email",
      `Verify your new email address by clicking the following link: ${url}`,
      `<div style="font-family: Arial, sans-serif; color: #0f172a;">
          <p>Your current email address approved changing your Upstream account to this email address.</p>
          <p>
            <a href="${url}" style="display: inline-block; padding: 10px 16px; border-radius: 6px; background-color: #0f172a; color: #ffffff; text-decoration: none;">
              Verify new email
            </a>
          </p>
          <p style="font-size: 12px; color: #64748b;">
            If the button doesn't work, copy and paste this URL into your browser:<br />
            ${url}
          </p>
          <p style="font-size: 12px; color: #64748b;">
            If you didn't request this change, you can ignore this email — your email address will stay the same.
          </p>
        </div>`
    )
  }
}
