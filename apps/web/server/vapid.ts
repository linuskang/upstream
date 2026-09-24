import crypto from "node:crypto"
import { env } from "@workspace/env"

function pad(buffer: Buffer, length: number) {
  if (buffer.length >= length) return buffer
  return Buffer.concat([Buffer.alloc(length - buffer.length), buffer])
}

export function getVapidPublicKey() {
  if (env.VAPID_PUBLIC_KEY) return env.VAPID_PUBLIC_KEY

  const curve = crypto.createECDH("prime256v1")
  curve.setPrivateKey(pad(Buffer.from(env.VAPID_PRIVATE_KEY, "base64url"), 32))
  return pad(curve.getPublicKey(), 65).toString("base64url")
}

export function getVapidSubject() {
  return env.VAPID_EMAIL.startsWith("mailto:")
    ? env.VAPID_EMAIL
    : `mailto:${env.VAPID_EMAIL}`
}
