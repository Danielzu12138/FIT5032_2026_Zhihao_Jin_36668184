import { authenticateRequest } from '../_shared/firebase-auth.js'
import { corsFor, jsonResponse, preflightResponse } from '../_shared/http.js'

const services = new Set([
  'Online wellbeing check-in',
  'Study stress support',
  'Work pressure support',
  'Sleep and routine planning',
])

function validateBooking(body) {
  const service = String(body.service || '').trim()
  const date = String(body.date || '')
  const time = String(body.time || '')

  if (!services.has(service)) return 'Select a valid support service.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Enter a valid booking date.'
  if (!/^\d{2}:\d{2}$/.test(time)) return 'Enter a valid booking time.'
  if (time < '09:00' || time > '17:30' || !['00', '30'].includes(time.slice(3))) {
    return 'Sessions are available in 30-minute slots from 9:00 AM to 5:30 PM.'
  }

  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const selected = new Date(year, month - 1, day, hour, minute)
  const isRealDate =
    selected.getFullYear() === year &&
    selected.getMonth() === month - 1 &&
    selected.getDate() === day &&
    selected.getHours() === hour &&
    selected.getMinutes() === minute
  if (!isRealDate || selected <= new Date()) {
    return 'Choose a future booking date and time.'
  }
  if ([0, 6].includes(selected.getDay())) return 'Sessions are available Monday to Friday.'
  return ''
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
    await authenticateRequest(request, env)
    const body = await request.json()
    const error = validateBooking(body)
    if (error) return jsonResponse(request, env, { error }, 400)
    return jsonResponse(request, env, { valid: true })
  } catch (error) {
    return jsonResponse(request, env, { error: error.message || 'Request rejected.' }, 401)
  }
}
