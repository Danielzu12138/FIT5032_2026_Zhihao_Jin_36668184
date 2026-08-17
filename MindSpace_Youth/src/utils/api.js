import { auth } from '../firebase'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

async function apiRequest(path, options = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : ''
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    })
    const contentType = response.headers.get('Content-Type') || ''
    const body = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : {}

    if (!contentType.includes('application/json')) {
      return {
        success: false,
        unavailable: true,
        error: 'The cloud function is not available in this environment.',
      }
    }

    if (!response.ok) {
      return {
        success: false,
        unavailable: response.status === 404,
        error: body.error || `Request failed with status ${response.status}.`,
      }
    }
    return { success: true, ...body }
  } catch {
    return {
      success: false,
      unavailable: true,
      error: 'The cloud function is not available in this local environment.',
    }
  }
}

export function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

export function checkBookingOnServer(booking) {
  return apiRequest('/api/check-booking', {
    method: 'POST',
    body: JSON.stringify(booking),
  })
}

export function sendEmailWithAttachment(payload) {
  return apiRequest('/api/send-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function startEmailRegistration(payload) {
  return apiRequest('/api/start-registration', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function completeEmailRegistration(payload) {
  return apiRequest('/api/complete-registration', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
