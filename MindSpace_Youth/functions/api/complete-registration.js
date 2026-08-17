import { createVerifiedFirebaseUser } from '../_shared/firebase-admin-rest.js'
import { corsFor, jsonResponse, preflightResponse } from '../_shared/http.js'
import {
  MAX_CODE_ATTEMPTS,
  RegistrationError,
  challengeKey,
  constantTimeEqual,
  hashRegistrationCode,
  normalizeEmail,
  validatePassword,
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

  try {
    const body = await request.json()
    const challengeId = String(body.challengeId || '')
    const email = normalizeEmail(body.email)
    const code = String(body.code || '').trim()
    const password = validatePassword(body.password)
    if (!/^[A-Za-z0-9_-]{20,80}$/.test(challengeId) || !/^\d{6}$/.test(code)) {
      throw new RegistrationError('Enter the six-digit verification code.')
    }

    const key = challengeKey(challengeId)
    const challengeValue = await env.REGISTRATION_CODES.get(key)
    if (!challengeValue) throw new RegistrationError('The verification code has expired.', 410)
    const challenge = JSON.parse(challengeValue)
    if (challenge.email !== email || Date.now() > Number(challenge.expiresAt || 0)) {
      await env.REGISTRATION_CODES.delete(key)
      throw new RegistrationError('The verification request is no longer valid.', 410)
    }

    const submittedHash = await hashRegistrationCode(
      env.OTP_PEPPER,
      challengeId,
      email,
      code,
    )
    if (!constantTimeEqual(submittedHash, challenge.codeHash)) {
      challenge.attempts = Number(challenge.attempts || 0) + 1
      if (challenge.attempts >= MAX_CODE_ATTEMPTS) {
        await env.REGISTRATION_CODES.delete(key)
        throw new RegistrationError('Too many incorrect codes. Request a new code.', 429)
      }
      const remainingTtl = Math.max(60, Math.ceil((challenge.expiresAt - Date.now()) / 1000))
      await env.REGISTRATION_CODES.put(key, JSON.stringify(challenge), {
        expirationTtl: remainingTtl,
      })
      throw new RegistrationError('The verification code is incorrect.')
    }

    const result = await createVerifiedFirebaseUser(env, {
      email,
      password,
      name: challenge.name,
    })
    await env.REGISTRATION_CODES.delete(key)
    return jsonResponse(request, env, {
      created: true,
      uid: result.uid,
      message: 'Email verified and account created.',
    }, 201)
  } catch (error) {
    const status = error instanceof RegistrationError ? error.status : Number(error.status || 500)
    return jsonResponse(
      request,
      env,
      { error: status >= 500 ? 'Account creation could not be completed.' : error.message },
      status,
    )
  }
}
