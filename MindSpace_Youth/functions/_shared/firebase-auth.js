let cachedKeys = null
let keysExpireAt = 0

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function decodeJsonSegment(value) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)))
}

async function firebaseJwks() {
  if (cachedKeys && Date.now() < keysExpireAt) return cachedKeys

  const response = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  )
  if (!response.ok) throw new Error('Firebase signing keys are unavailable.')

  cachedKeys = await response.json()
  keysExpireAt = Date.now() + 60 * 60 * 1000
  return cachedKeys
}

async function verifyFirebaseToken(token, projectId) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid authentication token.')

  const header = decodeJsonSegment(parts[0])
  const claims = decodeJsonSegment(parts[1])
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Invalid authentication token.')

  const jwks = await firebaseJwks()
  const jwk = jwks.keys.find((key) => key.kid === header.kid)
  if (!jwk) throw new Error('Firebase signing key was not found.')

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlToBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  )

  const now = Math.floor(Date.now() / 1000)
  const validClaims =
    claims.aud === projectId &&
    claims.iss === `https://securetoken.google.com/${projectId}` &&
    typeof claims.sub === 'string' &&
    claims.sub.length > 0 &&
    claims.exp > now &&
    claims.iat <= now

  if (!verified || !validClaims) throw new Error('Authentication token verification failed.')
  return claims
}

function firestoreValue(value = {}) {
  if ('stringValue' in value) return value.stringValue
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return Number(value.doubleValue)
  if ('timestampValue' in value) return value.timestampValue
  return null
}

async function fetchProfile(token, uid, projectId) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/users/${encodeURIComponent(uid)}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Authenticated Firestore profile could not be loaded.')

  const document = await response.json()
  return Object.fromEntries(
    Object.entries(document.fields || {}).map(([key, value]) => [key, firestoreValue(value)]),
  )
}

export async function authenticateRequest(request, env, options = {}) {
  const authorization = request.headers.get('Authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) throw new Error('Authentication is required.')

  const projectId = env.FIREBASE_PROJECT_ID || 'mindspace-youth'
  const claims = await verifyFirebaseToken(token, projectId)
  if (claims.email_verified !== true) throw new Error('A verified email address is required.')

  const profile = await fetchProfile(token, claims.sub, projectId)
  if (profile.uid !== claims.sub) throw new Error('Firebase profile UID does not match the account.')
  if (
    typeof claims.email !== 'string' ||
    String(profile.email || '').toLowerCase() !== claims.email.toLowerCase()
  ) {
    throw new Error('Firebase profile email does not match the verified account.')
  }
  if (options.adminOnly && profile.role !== 'admin') throw new Error('Administrator access is required.')

  return { claims, profile }
}
