import { corsFor, jsonResponse, preflightResponse } from '../_shared/http.js'
import {
  CHALLENGE_TTL_SECONDS,
  RegistrationError,
  challengeKey,
  domainAcceptsEmail,
  enforceRegistrationRateLimit,
  hashRegistrationCode,
  normalizeEmail,
  randomChallengeId,
  randomRegistrationCode,
  sanitizeRegistrationName,
  validateRegistrationIdentity,
} from '../_shared/registration.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return preflightResponse(request, env)
  if (!corsFor(request, env).originAllowed) {
    return jsonResponse(request, env, { error: 'Origin not allowed.' }, 403)
  }
  if (request.method !== 'POST') {
    return jsonResponse(request, env, { error: 'Method not allowed.' }, 405)
  }
  if (!env.REGISTRATION_CODES || !env.OTP_PEPPER) {
    return jsonResponse(request, env, { error: 'Registration verification is not configured.' }, 503)
  }
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return jsonResponse(request, env, { error: 'Email service is not configured.' }, 503)
  }

  try {
    const body = await request.json()
    const name = sanitizeRegistrationName(body.name)
    const email = normalizeEmail(body.email)
    const domain = validateRegistrationIdentity(name, email)
    if (!(await domainAcceptsEmail(domain))) {
      throw new RegistrationError('This email domain cannot receive email.')
    }

    await enforceRegistrationRateLimit(env.REGISTRATION_CODES, email, request)
    const challengeId = randomChallengeId()
    const code = randomRegistrationCode()
    const codeHash = await hashRegistrationCode(env.OTP_PEPPER, challengeId, email, code)
    const challenge = {
      email,
      name,
      codeHash,
      attempts: 0,
      expiresAt: Date.now() + CHALLENGE_TTL_SECONDS * 1000,
    }
    await env.REGISTRATION_CODES.put(
      challengeKey(challengeId),
      JSON.stringify(challenge),
      { expirationTtl: CHALLENGE_TTL_SECONDS },
    )

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [email],
        subject: 'Your MindSpace Youth verification code',
        text:
          'Your MindSpace Youth verification code is ' + code + '. ' +
          'It expires in 10 minutes. If you did not request this code, ignore this email.',
        html:
          '<p>Your MindSpace Youth verification code is:</p>' +
          '<p style="font-size:28px;font-weight:700;letter-spacing:6px">' + code + '</p>' +
          '<p>It expires in 10 minutes. If you did not request this code, ignore this email.</p>',
      }),
    })
    const emailResult = await emailResponse.json().catch(() => ({}))
    if (!emailResponse.ok) {
      await env.REGISTRATION_CODES.delete(challengeKey(challengeId))
      throw new RegistrationError(emailResult.message || 'Verification email delivery failed.', 502)
    }

    return jsonResponse(request, env, {
      challengeId,
      expiresIn: CHALLENGE_TTL_SECONDS,
      message: 'Verification code sent.',
    })
  } catch (error) {
    const status = error instanceof RegistrationError ? error.status : 500
    return jsonResponse(
      request,
      env,
      { error: status === 500 ? 'Could not start email verification.' : error.message },
      status,
    )
  }
}
