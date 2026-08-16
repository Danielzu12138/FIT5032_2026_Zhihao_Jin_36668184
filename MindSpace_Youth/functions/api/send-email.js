import { authenticateRequest } from '../_shared/firebase-auth.js'
import { corsFor, jsonResponse, preflightResponse } from '../_shared/http.js'

function validAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object') return false
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(String(attachment.filename || ''))) return false
  const content = String(attachment.content || '')
  return content.length > 0 && content.length <= 1_500_000 && /^[A-Za-z0-9+/=]+$/.test(content)
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return preflightResponse(request, env)
  if (!corsFor(request, env).originAllowed) {
    return jsonResponse(request, env, { error: 'Origin not allowed.' }, 403)
  }
  if (request.method !== 'POST') {
    return jsonResponse(request, env, { error: 'Method not allowed.' }, 405)
  }

  try {
    const { profile } = await authenticateRequest(request, env, { adminOnly: true })
    if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
      return jsonResponse(request, env, { error: 'Email service is not configured.' }, 503)
    }

    const body = await request.json()
    const subject = String(body.subject || '').trim().slice(0, 120)
    const text = String(body.text || '').trim().slice(0, 4000)
    if (!subject || !text || !validAttachment(body.attachment)) {
      return jsonResponse(request, env, { error: 'Invalid email or attachment data.' }, 400)
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [profile.email],
        subject,
        text,
        attachments: [
          {
            filename: body.attachment.filename,
            content: body.attachment.content,
          },
        ],
      }),
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      return jsonResponse(request, env, { error: result.message || 'Email delivery failed.' }, 502)
    }

    return jsonResponse(request, env, { sent: true, id: result.id || null })
  } catch (error) {
    return jsonResponse(request, env, { error: error.message || 'Request rejected.' }, 401)
  }
}

