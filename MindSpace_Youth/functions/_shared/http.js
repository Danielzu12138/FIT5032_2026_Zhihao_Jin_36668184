function configuredOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function corsFor(request, env) {
  const origin = request.headers.get('Origin') || ''
  const allowedOrigins = configuredOrigins(env)
  const originAllowed = !origin || !allowedOrigins.length || allowedOrigins.includes(origin)

  return {
    originAllowed,
    headers: {
      'Access-Control-Allow-Origin': originAllowed && origin ? origin : 'null',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  }
}

export function jsonResponse(request, env, body, status = 200) {
  const cors = corsFor(request, env)
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors.headers,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export function preflightResponse(request, env) {
  const cors = corsFor(request, env)
  if (!cors.originAllowed) return jsonResponse(request, env, { error: 'Origin not allowed.' }, 403)
  return new Response(null, { status: 204, headers: cors.headers })
}

