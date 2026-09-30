import { LineHarness } from '@line-harness/sdk'
import { renderFormPage, renderLandingPage } from './html'
import { resolveTheme, themes } from './themes'

export interface Env {
  LINE_HARNESS_API_URL: string
  LINE_HARNESS_API_KEY: string
  LIFF_ID: string
  DEFAULT_THEME: string
}

const FORM_ID = /^[A-Za-z0-9_-]{1,128}$/

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function validateEnv(env: Env): URL {
  if (!env.LINE_HARNESS_API_KEY) {
    throw new Error('LINE_HARNESS_API_KEY is not configured')
  }
  if (!env.LIFF_ID) {
    throw new Error('LIFF_ID is not configured')
  }
  const origin = new URL(env.LINE_HARNESS_API_URL)
  if (origin.protocol !== 'https:' || origin.hostname === 'your-line-harness.example.com') {
    throw new Error('LINE_HARNESS_API_URL must be the LineHarness HTTPS API origin')
  }
  return origin
}

function html(body: string, nonce: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': [
        "default-src 'none'",
        `script-src 'nonce-${nonce}' https://static.line-scdn.net`,
        `style-src 'nonce-${nonce}'`,
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.line.me https://*.line-scdn.net",
        "font-src 'self' data:",
        "base-uri 'none'",
        "form-action 'self'",
        "frame-ancestors 'self' https://*.line.me",
      ].join('; '),
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  })
}

async function showForm(request: Request, env: Env, formId: string): Promise<Response> {
  if (!FORM_ID.test(formId)) return new Response('Not Found', { status: 404 })

  const origin = validateEnv(env)
  const client = new LineHarness({
    apiUrl: origin.origin,
    apiKey: env.LINE_HARNESS_API_KEY,
  })
  const form = await client.forms.get(formId)
  if (!form.isActive) return new Response('このフォームは現在受付を停止しています。', { status: 410 })

  const url = new URL(request.url)
  const theme = resolveTheme(url.searchParams.get('theme'), env.DEFAULT_THEME)
  const nonce = crypto.randomUUID().replaceAll('-', '')
  return html(renderFormPage(form, theme, env.LIFF_ID, nonce), nonce)
}

async function submitForm(request: Request, env: Env, formId: string): Promise<Response> {
  if (!FORM_ID.test(formId)) return json({ success: false, error: 'Invalid form ID' }, 400)
  const origin = validateEnv(env)
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return json({ success: false, error: 'LINE authentication is required' }, 401)
  }

  let payload: { data?: Record<string, unknown> }
  try {
    payload = await request.json()
  } catch {
    return json({ success: false, error: 'Invalid JSON' }, 400)
  }
  if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
    return json({ success: false, error: 'Form data is required' }, 400)
  }

  const upstream = await fetch(
    new URL(`/api/forms/${encodeURIComponent(formId)}/submit`, origin),
    {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: payload.data }),
    },
  )

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    try {
      if (request.method === 'GET' && url.pathname === '/health') {
        validateEnv(env)
        return json({
          status: 'ok',
          plugin: 'form-theme-studio',
          themes: themes.map(theme => theme.id),
        })
      }
      if (request.method === 'GET' && url.pathname === '/api/themes') {
        return json({
          themes: themes.map(({ id, name, description }) => ({ id, name, description })),
        })
      }
      if (request.method === 'GET' && url.pathname === '/') {
        const nonce = crypto.randomUUID().replaceAll('-', '')
        const theme = resolveTheme(null, env.DEFAULT_THEME)
        return html(renderLandingPage(theme, nonce), nonce)
      }

      const formMatch = url.pathname.match(/^\/form\/([^/]+)$/)
      if (request.method === 'GET' && formMatch) {
        return await showForm(request, env, decodeURIComponent(formMatch[1]))
      }

      const submitMatch = url.pathname.match(/^\/api\/forms\/([^/]+)\/submit$/)
      if (request.method === 'POST' && submitMatch) {
        return await submitForm(request, env, decodeURIComponent(submitMatch[1]))
      }

      return new Response('Not Found', { status: 404 })
    } catch (error) {
      console.error(JSON.stringify({
        event: 'form-theme-studio.error',
        path: url.pathname,
        message: error instanceof Error ? error.message : 'Unknown error',
      }))
      return request.method === 'GET'
        ? new Response('フォームを読み込めませんでした。時間をおいて再度お試しください。', { status: 502 })
        : json({ success: false, error: 'LineHarnessへの送信に失敗しました' }, 502)
    }
}

export default {
  async fetch(request, env): Promise<Response> {
    return handleRequest(request, env)
  },
} satisfies ExportedHandler<Env>
