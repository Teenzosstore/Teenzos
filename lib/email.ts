type SendEmailInput = {
  to: {
    email: string
    name?: string | null
  }
  subject: string
  htmlContent: string
}

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@teenzosstore.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Teenzos'

  if (!apiKey) {
    throw new Error('Email service is not configured. Set BREVO_API_KEY.')
  }

  return { apiKey, senderEmail, senderName }
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  const { apiKey, senderEmail, senderName } = getBrevoConfig()

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: input.to.email, name: input.to.name || undefined }],
      subject: input.subject,
      htmlContent: input.htmlContent,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Brevo email request failed with status ${response.status}: ${body}`)
  }

  return response.json().catch(() => ({ success: true }))
}

/**
 * Send 6-Digit OTP Email for Login or Registration
 */
export async function sendOtpEmail({
  toEmail,
  otp,
  mode,
  name,
}: {
  toEmail: string
  otp: string
  mode: 'LOGIN' | 'REGISTER'
  name?: string | null
}) {
  const isRegister = mode === 'REGISTER'
  const subject = isRegister
    ? `${otp} is your TeenZos registration code`
    : `${otp} is your TeenZos login code`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0d0e; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #121417; border-radius: 16px; border: 1px solid #23272d; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              
              <!-- Brand Header -->
              <tr>
                <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1f2329;">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #F72585;">TEENZOS</h1>
                  <p style="margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #8a909a; font-weight: 700;">Streetwear & Lifestyle</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 32px 32px 20px; text-align: center;">
                  <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #ffffff;">
                    ${isRegister ? 'Welcome to TeenZos!' : 'Verification Code'}
                  </h2>
                  <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #9da3af;">
                    ${
                      name ? `Hey <strong style="color: #ffffff;">${name}</strong>,<br/>` : ''
                    }
                    ${
                      isRegister
                        ? 'Use the 6-digit code below to complete your TeenZos registration and activate your account.'
                        : 'Enter the 6-digit code below to securely sign in to your TeenZos account.'
                    }
                  </p>

                  <!-- OTP Digit Display Box -->
                  <div style="margin: 0 auto 28px; display: inline-block; background-color: #1b1e24; border: 2px solid #F72585; border-radius: 12px; padding: 16px 32px; letter-spacing: 10px; font-size: 32px; font-weight: 900; color: #F72585; font-family: monospace;">
                    ${otp}
                  </div>

                  <!-- Validity Note -->
                  <p style="margin: 0 0 16px; font-size: 12px; color: #6e7683; line-height: 1.5;">
                    This code is valid for <strong style="color: #e5e7eb;">10 minutes</strong>. Never share this code with anyone.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #1f2329; background-color: #0e1013;">
                  <p style="margin: 0 0 6px; font-size: 11px; color: #5a616d;">
                    If you did not request this verification, you can safely ignore this email.
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #444a54;">
                    &copy; ${new Date().getFullYear()} TeenZos Store. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  await sendTransactionalEmail({
    to: { email: toEmail, name: name || undefined },
    subject,
    htmlContent,
  })
}

/**
 * Send Password Reset Link Email
 */
export async function sendPasswordResetEmail({
  toEmail,
  resetUrl,
  name,
}: {
  toEmail: string
  resetUrl: string
  name?: string | null
}) {
  const subject = 'Reset your TeenZos password'

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0d0e; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #121417; border-radius: 16px; border: 1px solid #23272d; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">

              <!-- Brand Header -->
              <tr>
                <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1f2329;">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #F72585;">TEENZOS</h1>
                  <p style="margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #8a909a; font-weight: 700;">Streetwear & Lifestyle</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 32px 32px 24px; text-align: center;">
                  <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #ffffff;">
                    Reset Your Password
                  </h2>
                  <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #9da3af;">
                    ${name ? `Hey <strong style="color: #ffffff;">${name}</strong>,<br/>` : ''}
                    We received a request to reset the password for your TeenZos account. Click the button below to choose a new password.
                  </p>

                  <div style="text-align: center; margin-bottom: 20px;">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #F72585; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 8px; font-weight: 800; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                      RESET PASSWORD →
                    </a>
                  </div>

                  <p style="margin: 0 0 16px; font-size: 12px; color: #6e7683; line-height: 1.5;">
                    This link is valid for <strong style="color: #e5e7eb;">30 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your password will stay the same.
                  </p>

                  <p style="margin: 0; font-size: 11px; color: #4a515c; word-break: break-all;">
                    Or paste this link in your browser:<br/>
                    <a href="${resetUrl}" style="color: #36B8C5;">${resetUrl}</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #1f2329; background-color: #0e1013;">
                  <p style="margin: 0; font-size: 11px; color: #444a54;">
                    &copy; ${new Date().getFullYear()} TeenZos Store. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  await sendTransactionalEmail({
    to: { email: toEmail, name: name || undefined },
    subject,
    htmlContent,
  })
}

/**
 * Send Welcome Email upon Registration
 */
export async function sendWelcomeEmail({
  toEmail,
  fullName,
}: {
  toEmail: string
  fullName: string
}) {
  const subject = `Welcome to the TeenZos Family, ${fullName}! 🚀`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0d0e; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #121417; border-radius: 16px; border: 1px solid #23272d; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              
              <!-- Brand Header -->
              <tr>
                <td style="padding: 36px 32px 24px; text-align: center; border-bottom: 1px solid #1f2329;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #F72585;">TEENZOS</h1>
                  <p style="margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #8a909a; font-weight: 700;">Streetwear & Oversized Drops</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 32px 32px 24px;">
                  <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #ffffff; text-align: center;">
                    You're Officially In! 🎉
                  </h2>
                  <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #9da3af; text-align: center;">
                    Hey <strong style="color: #ffffff;">${fullName}</strong>, thank you for joining TeenZos. Your account is active and ready for premium streetwear drops.
                  </p>

                  <div style="background-color: #1a1d24; border: 1px solid #2a2f3a; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                    <p style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #ffffff;">Here is what you get with your TeenZos account:</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #9da3af; line-height: 1.8;">
                      <li>Live Order & AWB Courier Tracking</li>
                      <li>Faster One-Click Checkout & Saved Addresses</li>
                      <li>Exclusive VIP early access to limited edition drops</li>
                      <li>Easy 7-day doorstep exchange support</li>
                    </ul>
                  </div>

                  <div style="text-align: center; margin-bottom: 12px;">
                    <a href="https://teenzosstore.com/shop" style="display: inline-block; background-color: #F72585; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 800; font-size: 14px; letter-spacing: 0.5px;">
                      EXPLORE NEW DROPS →
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #1f2329; background-color: #0e1013;">
                  <p style="margin: 0 0 6px; font-size: 11px; color: #5a616d;">
                    Need help with an order? Email us anytime at support@teenzosstore.com
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #444a54;">
                    &copy; ${new Date().getFullYear()} TeenZos Store. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    await sendTransactionalEmail({
      to: { email: toEmail, name: fullName },
      subject,
      htmlContent,
    })
  } catch (err) {
    console.error('Welcome email dispatch error:', err)
  }
}

/**
 * Send VIP Welcome Email to new Newsletter Subscribers
 */
export async function sendNewsletterWelcomeEmail({
  toEmail,
}: {
  toEmail: string
}) {
  const subject = `Welcome to the VIP Crew! Here's 10% OFF your next drop ⚡`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0d0e; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #121417; border-radius: 16px; border: 1px solid #23272d; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
              
              <!-- Brand Header -->
              <tr>
                <td style="padding: 36px 32px 20px; text-align: center; border-bottom: 1px solid #1f2329;">
                  <span style="display: inline-block; padding: 4px 12px; background: rgba(247,37,133,0.15); border: 1px solid rgba(247,37,133,0.3); border-radius: 20px; font-size: 11px; font-weight: 800; color: #F72585; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;">
                    VIP ACCESS GRANTED
                  </span>
                  <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 3px; color: #ffffff;">
                    TEEN<span style="color: #F72585;">ZOS</span>.
                  </h1>
                  <p style="margin: 6px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #8a909a; font-weight: 700;">
                    STREETWEAR • OVERSIZED DROPS
                  </p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 32px 32px 24px;">
                  <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #ffffff; text-align: center;">
                    You&apos;re On The Insider List 🔥
                  </h2>
                  <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #9da3af; text-align: center;">
                    Thank you for subscribing to TeenZos. You&apos;ll be the first to know whenever a new limited-edition drop drops, secret discount codes go live, or private community sales open.
                  </p>

                  <!-- Discount Box -->
                  <div style="background: linear-gradient(135deg, rgba(247,37,133,0.12) 0%, rgba(54,184,197,0.12) 100%); border: 1.5px dashed #F72585; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
                    <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; color: #36B8C5; letter-spacing: 2px; text-transform: uppercase;">
                      YOUR WELCOME GIFT
                    </p>
                    <p style="margin: 0 0 10px; font-size: 18px; font-weight: 800; color: #ffffff;">
                      FLAT 10% OFF ON YOUR FIRST ORDER
                    </p>
                    <div style="display: inline-block; background-color: #F72585; color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: 4px; padding: 10px 24px; border-radius: 8px; border: 1px solid #ff4ca1;">
                      TEENZOS10
                    </div>
                    <p style="margin: 10px 0 0; font-size: 11px; color: #8a909a;">
                      Use code at checkout • Valid on all tees, hoodies & oversized drops
                    </p>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin-bottom: 12px;">
                    <a href="https://teenzosstore.com/shop" style="display: inline-block; background-color: #F72585; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 8px; font-weight: 800; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                      EXPLORE NEW DROPS NOW →
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #1f2329; background-color: #0e1013;">
                  <p style="margin: 0 0 6px; font-size: 11px; color: #5a616d;">
                    You are receiving this email because you subscribed on teenzosstore.com.
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #444a54;">
                    &copy; ${new Date().getFullYear()} TeenZos Store. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    await sendTransactionalEmail({
      to: { email: toEmail },
      subject,
      htmlContent,
    })
  } catch (err) {
    console.error('Newsletter welcome email dispatch error:', err)
  }
}

/**
 * Send Broadcast / Campaign Email to Subscribers
 */
export async function sendNewsletterCampaignEmail({
  toEmail,
  subject,
  headline,
  bodyText,
  badgeText = 'NEW DROP ALERT',
  ctaText = 'SHOP NOW',
  ctaUrl = 'https://teenzosstore.com/shop',
  offerCode,
}: {
  toEmail: string
  subject: string
  headline: string
  bodyText: string
  badgeText?: string
  ctaText?: string
  ctaUrl?: string
  offerCode?: string
}) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0d0e; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #121417; border-radius: 16px; border: 1px solid #23272d; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
              
              <!-- Brand Header -->
              <tr>
                <td style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid #1f2329;">
                  <span style="display: inline-block; padding: 4px 12px; background: rgba(247,37,133,0.15); border: 1px solid rgba(247,37,133,0.3); border-radius: 20px; font-size: 11px; font-weight: 800; color: #F72585; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;">
                    ${badgeText}
                  </span>
                  <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 3px; color: #ffffff;">
                    TEEN<span style="color: #F72585;">ZOS</span>.
                  </h1>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 32px 32px 24px;">
                  <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 800; color: #ffffff; text-align: center; line-height: 1.3;">
                    ${headline}
                  </h2>
                  <div style="margin: 0 0 24px; font-size: 14px; line-height: 1.7; color: #9da3af; white-space: pre-line;">
                    ${bodyText}
                  </div>

                  ${
                    offerCode
                      ? `
                  <div style="background: linear-gradient(135deg, rgba(247,37,133,0.15) 0%, rgba(54,184,197,0.15) 100%); border: 1.5px dashed #F72585; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; color: #36B8C5; letter-spacing: 2px; text-transform: uppercase;">
                      DISCOUNT CODE
                    </p>
                    <div style="display: inline-block; background-color: #F72585; color: #ffffff; font-size: 18px; font-weight: 900; letter-spacing: 3px; padding: 8px 20px; border-radius: 6px;">
                      ${offerCode}
                    </div>
                  </div>
                  `
                      : ''
                  }

                  <!-- CTA Button -->
                  <div style="text-align: center; margin-bottom: 12px;">
                    <a href="${ctaUrl}" style="display: inline-block; background-color: #F72585; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 8px; font-weight: 800; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                      ${ctaText} →
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #1f2329; background-color: #0e1013;">
                  <p style="margin: 0 0 6px; font-size: 11px; color: #5a616d;">
                    You are receiving this exclusive update as a TeenZos VIP subscriber.
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #444a54;">
                    &copy; ${new Date().getFullYear()} TeenZos Store. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  await sendTransactionalEmail({
    to: { email: toEmail },
    subject,
    htmlContent,
  })
}

