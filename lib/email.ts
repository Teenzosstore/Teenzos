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
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'teenzosstore@gmail.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Teenzosstore'

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
}
