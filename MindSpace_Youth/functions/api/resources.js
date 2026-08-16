import { corsFor, jsonResponse, preflightResponse } from '../_shared/http.js'

const resources = [
  { id: 'anxiety', title: 'Anxiety first steps', category: 'Anxiety' },
  { id: 'study-pressure', title: 'Study pressure reset', category: 'Stress & Study' },
  { id: 'sleep', title: 'Sleep and screen fatigue', category: 'Sleep' },
  { id: 'burnout', title: 'Burnout warning signs', category: 'Work Pressure' },
]

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return preflightResponse(request, env)
  if (!corsFor(request, env).originAllowed) {
    return jsonResponse(request, env, { error: 'Origin not allowed.' }, 403)
  }
  if (request.method !== 'GET') {
    return jsonResponse(request, env, { error: 'Method not allowed.' }, 405)
  }

  return jsonResponse(request, env, { count: resources.length, resources })
}

