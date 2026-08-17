let cachedAccessToken = ''
let accessTokenExpiresAt = 0

function bytesToBase64Url(bytes) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function textToBase64Url(value) {
  return bytesToBase64Url(new TextEncoder().encode(value))
}

function privateKeyBytes(value) {
  const normalized = String(value || '').replace(/\\n/g, '\n')
  const base64 = normalized
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binary = atob(base64)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function requiredFirebaseConfig(env) {
  const config = {
    projectId: env.FIREBASE_PROJECT_ID,
    apiKey: env.FIREBASE_WEB_API_KEY,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY,
  }
  if (Object.values(config).some((value) => !value)) {
    throw new Error('Firebase server registration is not configured.')
  }
  return config
}

async function googleAccessToken(env) {
  if (cachedAccessToken && Date.now() < accessTokenExpiresAt) return cachedAccessToken
  const { clientEmail, privateKey } = requiredFirebaseConfig(env)
  const now = Math.floor(Date.now() / 1000)
  const header = textToBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = textToBase64Url(JSON.stringify({
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    iat: now,
    exp: now + 3600,
  }))
  const unsignedToken = header + '.' + claims
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken),
  )
  const assertion = unsignedToken + '.' + bytesToBase64Url(new Uint8Array(signature))

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.access_token) {
    throw new Error('Firebase administrator authentication failed.')
  }

  cachedAccessToken = result.access_token
  accessTokenExpiresAt = Date.now() + (Number(result.expires_in || 3600) - 120) * 1000
  return cachedAccessToken
}

function firebaseError(result, fallback) {
  const code = String(result?.error?.message || result?.error?.status || '')
  const messages = {
    EMAIL_EXISTS: 'An account with this email already exists.',
    INVALID_EMAIL: 'Enter a valid email address.',
    OPERATION_NOT_ALLOWED: 'Email and password registration is not enabled.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many registration attempts. Try again later.',
    WEAK_PASSWORD: 'Password does not meet Firebase security requirements.',
  }
  const knownCode = Object.keys(messages).find((key) => code.includes(key))
  return knownCode ? messages[knownCode] : fallback
}

async function deleteFirebaseUser(projectId, localId, accessToken) {
  if (!localId || !accessToken) return
  await fetch(
    'https://identitytoolkit.googleapis.com/v1/projects/' +
      encodeURIComponent(projectId) + '/accounts:delete',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localId }),
    },
  ).catch(() => {})
}

async function deleteFirestoreProfile(projectId, localId, accessToken) {
  if (!localId || !accessToken) return
  await fetch(
    'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(projectId) +
      '/databases/(default)/documents/users/' + encodeURIComponent(localId),
    { method: 'DELETE', headers: { Authorization: 'Bearer ' + accessToken } },
  ).catch(() => {})
}

export async function createVerifiedFirebaseUser(env, { email, password, name }) {
  const { projectId, apiKey } = requiredFirebaseConfig(env)
  const accessToken = await googleAccessToken(env)
  let localId = ''

  try {
    const signUpResponse = await fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' +
        encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    )
    const signUpResult = await signUpResponse.json().catch(() => ({}))
    if (!signUpResponse.ok || !signUpResult.localId) {
      const message = firebaseError(signUpResult, 'Firebase could not create this account.')
      const error = new Error(message)
      error.status = message.includes('already exists') ? 409 : 400
      throw error
    }
    localId = signUpResult.localId

    const updateResponse = await fetch(
      'https://identitytoolkit.googleapis.com/v1/projects/' +
        encodeURIComponent(projectId) + '/accounts:update',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          localId,
          emailVerified: true,
          displayName: name,
        }),
      },
    )
    const updateResult = await updateResponse.json().catch(() => ({}))
    if (!updateResponse.ok) {
      throw new Error(firebaseError(updateResult, 'Firebase could not verify this account.'))
    }

    const profileResponse = await fetch(
      'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(projectId) +
        '/databases/(default)/documents/users?documentId=' + encodeURIComponent(localId),
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            uid: { stringValue: localId },
            name: { stringValue: name },
            email: { stringValue: email },
            role: { stringValue: 'young_user' },
            createdAt: { stringValue: new Date().toISOString() },
          },
        }),
      },
    )
    const profileResult = await profileResponse.json().catch(() => ({}))
    if (!profileResponse.ok) {
      throw new Error(profileResult?.error?.message || 'Firestore could not create the user profile.')
    }
    return { uid: localId }
  } catch (error) {
    if (localId) await deleteFirestoreProfile(projectId, localId, accessToken)
    if (localId) await deleteFirebaseUser(projectId, localId, accessToken)
    throw error
  }
}
