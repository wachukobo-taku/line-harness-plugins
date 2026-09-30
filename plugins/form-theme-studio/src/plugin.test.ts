import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleRequest, type Env } from './index'
import { escapeHtml, renderField } from './html'
import { resolveTheme } from './themes'

const env: Env = {
  LINE_HARNESS_API_URL: 'https://harness.example.test',
  LINE_HARNESS_API_KEY: 'test-key',
  LIFF_ID: '1234567890-test',
  DEFAULT_THEME: 'line',
}

afterEach(() => vi.restoreAllMocks())

describe('theme presets', () => {
  it('指定テーマを解決し、不正値は既定テーマへ戻す', () => {
    expect(resolveTheme('midnight').id).toBe('midnight')
    expect(resolveTheme('unknown', 'ocean').id).toBe('ocean')
  })

  it('HTMLへ埋め込む回答項目をエスケープする', () => {
    expect(escapeHtml('<script>alert(1)</script>')).not.toContain('<script>')
    const html = renderField({
      name: 'name',
      label: '<img src=x onerror=alert(1)>',
      type: 'text',
    })
    expect(html).toContain('&lt;img')
    expect(html).not.toContain('<img')
  })
})

describe('worker routes', () => {
  it('テーマ一覧を秘密情報なしで返す', async () => {
    const response = await handleRequest(new Request('https://plugin.example/api/themes'), env)
    const body = await response.json() as { themes: Array<{ id: string }> }
    expect(response.status).toBe(200)
    expect(body.themes.map(theme => theme.id)).toEqual(['line', 'midnight', 'ocean', 'sakura', 'minimal'])
    expect(JSON.stringify(body)).not.toContain('test-key')
  })

  it('LineHarnessのフォームを選択テーマで表示する', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json({
      success: true,
      data: {
        id: 'form-1',
        name: '無料診断',
        description: '3分で現在地を確認',
        fields: [{ name: 'goal', label: '目標', type: 'text', required: true }],
        onSubmitTagId: null,
        onSubmitScenarioId: null,
        onSubmitMessageType: null,
        onSubmitMessageContent: null,
        saveToMetadata: true,
        isActive: true,
        submitCount: 0,
        ogTitle: null,
        ogDescription: null,
        ogImageUrl: null,
        createdAt: '2026-09-30',
        updatedAt: '2026-09-30',
      },
    }))
    const response = await handleRequest(
      new Request('https://plugin.example/form/form-1?theme=midnight'),
      env,
    )
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(body).toContain('無料診断')
    expect(body).toContain('Midnight Premium')
    expect(response.headers.get('Content-Security-Policy')).toContain('static.line-scdn.net')
  })

  it('LINE ID tokenをLineHarnessへ転送して回答を保存する', async () => {
    const upstream = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json({ success: true, data: { id: 'submission-1' } }, { status: 201 }),
    )
    const response = await handleRequest(
      new Request('https://plugin.example/api/forms/form-1/submit', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer line-id-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { goal: '売上改善' }, ignored: 'value' }),
      }),
      env,
    )
    expect(response.status).toBe(201)
    const [, init] = upstream.mock.calls[0]
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer line-id-token' })
    expect(JSON.parse(String(init?.body))).toEqual({ data: { goal: '売上改善' } })
  })

  it('認証なしの回答送信を拒否する', async () => {
    const response = await handleRequest(
      new Request('https://plugin.example/api/forms/form-1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { goal: '売上改善' } }),
      }),
      env,
    )
    expect(response.status).toBe(401)
  })

  it('不正なフォームIDを上流へ送らない', async () => {
    const upstream = vi.spyOn(globalThis, 'fetch')
    const response = await handleRequest(
      new Request('https://plugin.example/form/%2E%2E%2Fsecret'),
      env,
    )
    expect(response.status).toBe(404)
    expect(upstream).not.toHaveBeenCalled()
  })
})
