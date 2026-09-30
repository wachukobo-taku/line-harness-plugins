export interface RuleFriend {
  id: string
  isFollowing: boolean
  lineAccountId?: string | null
  metadata: Record<string, unknown>
  tags: { id: string }[]
}

export interface LeadScore {
  score: number
  reasons: string[]
}

function finiteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}

/**
 * 診断と行動を0〜100点へ変換します。
 * フィールド名や配点は、各事業の計測項目に合わせて変更してください。
 */
export function calculateLeadScore(metadata: Record<string, unknown>): LeadScore {
  let score = 0
  const reasons: string[] = []

  if (metadata.consultationRequested === true) {
    score += 60
    reasons.push('相談希望')
  }
  if (metadata.diagnosisCompleted === true) {
    score += 20
    reasons.push('診断完了')
  }

  const pricingPageViews = Math.floor(finiteNumber(metadata.pricingPageViews))
  if (pricingPageViews > 0) {
    score += Math.min(20, pricingPageViews * 10)
    reasons.push(`料金ページ閲覧 ${pricingPageViews}回`)
  }

  const videoWatchPercent = finiteNumber(metadata.videoWatchPercent)
  if (videoWatchPercent >= 75) {
    score += 20
    reasons.push('動画75%以上視聴')
  } else if (videoWatchPercent >= 50) {
    score += 10
    reasons.push('動画50%以上視聴')
  }

  const trackedLinkClicks = Math.floor(finiteNumber(metadata.trackedLinkClicks))
  if (trackedLinkClicks > 0) {
    score += Math.min(20, trackedLinkClicks * 5)
    reasons.push(`計測リンク ${trackedLinkClicks}回クリック`)
  }

  return { score: Math.min(100, score), reasons }
}

export function matchesRule(friend: RuleFriend, threshold = 60): boolean {
  return calculateLeadScore(friend.metadata).score >= threshold
}

interface HarnessClient {
  friends: {
    list(params: { accountId: string; limit: number; offset: number }): Promise<{
      items: RuleFriend[]
      hasNextPage: boolean
    }>
    get(id: string): Promise<RuleFriend>
    addTag(friendId: string, tagId: string): Promise<void>
  }
}

export async function applyLeadScoreTag(
  client: HarnessClient,
  options: { accountId: string; tagId: string; threshold: number; dryRun: boolean },
) {
  if (!options.accountId.trim() || !options.tagId.trim()) {
    throw new Error('LINE_ACCOUNT_ID と TARGET_TAG_ID を設定してください。')
  }
  if (!Number.isInteger(options.threshold) || options.threshold < 1 || options.threshold > 100) {
    throw new Error('SCORE_THRESHOLD は1〜100の整数で指定してください。')
  }

  const candidates = new Map<string, RuleFriend>()
  let scanned = 0

  for (let page = 0; ; page++) {
    if (page === 10) {
      throw new Error('1,000件を超えました。差分同期またはキュー処理に変更してください。')
    }
    const result = await client.friends.list({
      accountId: options.accountId,
      limit: 100,
      offset: page * 100,
    })
    for (const friend of result.items) {
      scanned++
      if (friend.lineAccountId !== options.accountId) {
        throw new Error('APIのアカウント絞り込みを確認できません。書き込みを停止しました。')
      }
      if (
        friend.isFollowing &&
        matchesRule(friend, options.threshold) &&
        !friend.tags.some(tag => tag.id === options.tagId)
      ) {
        candidates.set(friend.id, friend)
      }
    }
    if (!result.hasNextPage) break
    if (result.items.length === 0) {
      throw new Error('空のページに継続フラグがあります。APIのページングを確認してください。')
    }
  }

  let applied = 0
  if (!options.dryRun) {
    for (const friend of candidates.values()) {
      const current = await client.friends.get(friend.id)
      if (
        current.lineAccountId !== options.accountId ||
        !current.isFollowing ||
        !matchesRule(current, options.threshold) ||
        current.tags.some(tag => tag.id === options.tagId)
      ) {
        continue
      }
      await client.friends.addTag(current.id, options.tagId)
      applied++
    }
  }

  return {
    scanned,
    matched: candidates.size,
    applied,
    dryRun: options.dryRun,
    threshold: options.threshold,
  }
}
