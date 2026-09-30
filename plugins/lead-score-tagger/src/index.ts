import { LineHarness } from '@line-harness/sdk'
import { applyLeadScoreTag } from './rules'

type PluginEnv = Env & { LINE_HARNESS_API_KEY: string }

function parseThreshold(value: string): number {
  const threshold = Number(value)
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
    throw new Error('SCORE_THRESHOLD は1〜100の整数で指定してください。')
  }
  return threshold
}

export default {
  async scheduled(_controller, env) {
    if (!env.LINE_HARNESS_API_KEY) {
      throw new Error('LINE_HARNESS_API_KEY をsecretに設定してください。')
    }
    if (env.DRY_RUN !== 'true' && env.DRY_RUN !== 'false') {
      throw new Error('DRY_RUN は true / false を指定してください。')
    }
    const url = new URL(env.LINE_HARNESS_API_URL)
    if (url.protocol !== 'https:' || url.hostname === 'your-line-harness.example.com') {
      throw new Error('LINE_HARNESS_API_URL に本体のHTTPS API URLを設定してください。')
    }

    const threshold = parseThreshold(env.SCORE_THRESHOLD)
    const client = new LineHarness({
      apiUrl: env.LINE_HARNESS_API_URL,
      apiKey: env.LINE_HARNESS_API_KEY,
      lineAccountId: env.LINE_ACCOUNT_ID,
    })
    const result = await applyLeadScoreTag(client, {
      accountId: env.LINE_ACCOUNT_ID,
      tagId: env.TARGET_TAG_ID,
      threshold,
      dryRun: env.DRY_RUN === 'true',
    })
    console.log(JSON.stringify({ event: 'lead-score-tagger.completed', ...result }))
  },

  async fetch(request, env) {
    if (request.method === 'GET' && new URL(request.url).pathname === '/health') {
      return Response.json({
        status: 'ok',
        plugin: 'lead-score-tagger',
        dryRun: env.DRY_RUN === 'true',
        threshold: parseThreshold(env.SCORE_THRESHOLD),
      })
    }
    return new Response('Not Found', { status: 404 })
  },
} satisfies ExportedHandler<PluginEnv>
