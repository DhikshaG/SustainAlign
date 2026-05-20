import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (env.SMTP_HOST && env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  }
  return transporter
}

export async function sendEmail({ to, subject, text, html }) {
  const tx = getTransporter()
  const from = env.SMTP_FROM || 'noreply@sustainalign.com'

  if (!tx || env.NODE_ENV === 'development') {
    console.log(JSON.stringify({ event: 'email.dev', to, subject, text }))
    return { dev: true }
  }

  await tx.sendMail({ from, to, subject, text, html })
  return { sent: true }
}

export async function sendMfaCode(email, code) {
  return sendEmail({
    to: email,
    subject: 'Your SustainAlign verification code',
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
  })
}

export async function sendPasswordReset(email, token) {
  const link = `${env.APP_URL}/auth/reset-password?token=${token}`
  return sendEmail({
    to: email,
    subject: 'Reset your SustainAlign password',
    text: `Reset your password: ${link}\n\nThis link expires in 1 hour.`,
    html: `<p><a href="${link}">Reset your password</a></p><p>This link expires in 1 hour.</p>`,
  })
}

export async function sendInvitation(email, token, tenantName) {
  const link = `${env.APP_URL}/signup/corporate?invite=${token}`
  return sendEmail({
    to: email,
    subject: `You're invited to join ${tenantName} on SustainAlign`,
    text: `Join ${tenantName}: ${link}`,
    html: `<p>You've been invited to join <strong>${tenantName}</strong>.</p><p><a href="${link}">Accept invitation</a></p>`,
  })
}
