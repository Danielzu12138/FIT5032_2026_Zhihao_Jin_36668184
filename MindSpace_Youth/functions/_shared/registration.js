const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CHALLENGE_TTL_SECONDS = 10 * 60
const RESEND_COOLDOWN_SECONDS = 60
const MAX_CODE_ATTEMPTS = 5

const disposableDomains = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'maildrop.cc',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
])

export class RegistrationError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

function bytesToBase64Url(bytes) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return bytesToBase64Url(new Uint8Array(digest))
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function sanitizeRegistrationName(value) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 60)
}

export function validateRegistrationIdentity(name, email) {
  if (!name) throw new RegistrationError('Enter your full name.')
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new RegistrationError('Enter a valid email address.')
  }

  const domain = email.split('@').pop()
  if (!domain || disposableDomains.has(domain)) {
    throw new RegistrationError('Disposable email addresses cannot be used.')
  }
  return domain
}

export function validatePassword(value) {
  const password = String(value || '')
  if (password.length < 8) throw new RegistrationError('Password must be at least 8 characters.')
  if (password.length > 128) throw new RegistrationError('Password must be 128 characters or fewer.')
  return password
}

export async function domainAcceptsEmail(domain) {
  const response = await fetch(
    'https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(domain) + '&type=MX',
    { headers: { Accept: 'application/dns-json' } },
  )
  if (!response.ok) {
    throw new RegistrationError('Email domain validation is temporarily unavailable.', 503)
  }

  const result = await response.json()
  return result.Status === 0 && Array.isArray(result.Answer) &&
    result.Answer.some((answer) => answer.type === 15 && String(answer.data || '').trim())
}

export function randomRegistrationCode() {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return String((values[0] % 900000) + 100000)
}

export function randomChallengeId() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return bytesToBase64Url(bytes)
}

export async function hashRegistrationCode(secret, challengeId, email, code) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(challengeId + ':' + email + ':' + code),
  )
  return bytesToBase64Url(new Uint8Array(signature))
}

export function constantTimeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) {
    return false
  }
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

export function challengeKey(challengeId) {
  return 'registration:challenge:' + challengeId
}

export async function enforceRegistrationRateLimit(kv, email, request) {
  const emailHash = await sha256(email)
  const ipAddress = request.headers.get('CF-Connecting-IP') || 'unknown'
  const ipHash = await sha256(ipAddress)
  const cooldownKey = 'registration:cooldown:' + emailHash
  if (await kv.get(cooldownKey)) {
    throw new RegistrationError('Wait one minute before requesting another code.', 429)
  }

  const hour = new Date().toISOString().slice(0, 13)
  const emailRateKey = 'registration:rate:email:' + emailHash + ':' + hour
  const ipRateKey = 'registration:rate:ip:' + ipHash + ':' + hour
  const [emailCountValue, ipCountValue] = await Promise.all([
    kv.get(emailRateKey),
    kv.get(ipRateKey),
  ])
  const emailCount = Number(emailCountValue || 0)
  const ipCount = Number(ipCountValue || 0)
  if (emailCount >= 5 || ipCount >= 20) {
    throw new RegistrationError('Too many verification requests. Try again later.', 429)
  }

  await Promise.all([
    kv.put(cooldownKey, '1', { expirationTtl: RESEND_COOLDOWN_SECONDS }),
    kv.put(emailRateKey, String(emailCount + 1), { expirationTtl: 60 * 60 }),
    kv.put(ipRateKey, String(ipCount + 1), { expirationTtl: 60 * 60 }),
  ])
}

export {
  CHALLENGE_TTL_SECONDS,
  MAX_CODE_ATTEMPTS,
}
