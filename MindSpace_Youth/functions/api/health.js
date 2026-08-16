import { corsFor, jsonResponse, preflightResponse } from '../_shared/http.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return preflightResponse(request, env)
  if (!corsFor(request, env).originAllowed) {
    return jsonResponse(request, env, { error: 'Origin not allowed.' }, 403)
  }
  if (request.method !== 'GET') {
    return jsonResponse(request, env, { error: 'Method not allowed.' }, 405)
  }

  return jsonResponse(request, env, {
    service: 'MindSpace Youth API',
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}

