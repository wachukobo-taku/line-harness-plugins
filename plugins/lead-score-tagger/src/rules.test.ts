import { describe, expect, it, vi } from 'vitest'
import {
  applyLeadScoreTag,
  calculateLeadScore,
  matchesRule,
  type RuleFriend,
} from './rules'

function friend(overrides: Partial<RuleFriend> = {}): RuleFriend {
  return {
    id: 'friend-1',
    isFollowing: true,
    lineAccountId: 'account-1',
    metadata: {},
    tags: [],
    ...overrides,
  }
}

describe('calculateLeadScore', () => {
  it('相談希望を最優先で高見込みとして判定する', () => {
    expect(calculateLeadScore({ consultationRequested: true })).toEqual({
      score: 60,
      reasons: ['相談希望'],
    })
  })

  it('複数行動を合算し100点を上限にする', () => {
    const result = calculateLeadScore({
      consultationRequested: true,
      diagnosisCompleted: true,
      pricingPageViews: 3,
      videoWatchPercent: 90,
      trackedLinkClicks: 8,
    })
    expect(result.score).toBe(100)
    expect(result.reasons).toHaveLength(5)
  })

  it('文字列や不正な値を得点へ混ぜない', () => {
    expect(calculateLeadScore({
      diagnosisCompleted: 'true',
      pricingPageViews: '3',
      videoWatchPercent: Number.NaN,
    }).score).toBe(0)
  })
})

describe('matchesRule', () => {
  it('設定したしきい値以上だけを対象にする', () => {
    const target = friend({ metadata: { diagnosisCompleted: true, pricingPageViews: 2, trackedLinkClicks: 4 } })
    expect(matchesRule(target, 60)).toBe(true)
    expect(matchesRule(target, 61)).toBe(false)
  })
})

describe('applyLeadScoreTag', () => {
  it('確認モードでは候補を数えるがタグを書き込まない', async () => {
    const target = friend({ metadata: { consultationRequested: true } })
    const addTag = vi.fn()
    const client = {
      friends: {
        list: vi.fn().mockResolvedValue({ items: [target], hasNextPage: false }),
        get: vi.fn(),
        addTag,
      },
    }
    const result = await applyLeadScoreTag(client, {
      accountId: 'account-1',
      tagId: 'tag-hot',
      threshold: 60,
      dryRun: true,
    })
    expect(result).toMatchObject({ scanned: 1, matched: 1, applied: 0, dryRun: true })
    expect(addTag).not.toHaveBeenCalled()
  })

  it('本実行前に最新状態を再確認して一度だけタグを付ける', async () => {
    const target = friend({ metadata: { consultationRequested: true } })
    const addTag = vi.fn()
    const client = {
      friends: {
        list: vi.fn().mockResolvedValue({ items: [target], hasNextPage: false }),
        get: vi.fn().mockResolvedValue(target),
        addTag,
      },
    }
    const result = await applyLeadScoreTag(client, {
      accountId: 'account-1',
      tagId: 'tag-hot',
      threshold: 60,
      dryRun: false,
    })
    expect(result.applied).toBe(1)
    expect(addTag).toHaveBeenCalledOnce()
    expect(addTag).toHaveBeenCalledWith('friend-1', 'tag-hot')
  })

  it('別LINEアカウントの友だちが混ざったら書き込み前に停止する', async () => {
    const client = {
      friends: {
        list: vi.fn().mockResolvedValue({
          items: [friend({ lineAccountId: 'other-account', metadata: { consultationRequested: true } })],
          hasNextPage: false,
        }),
        get: vi.fn(),
        addTag: vi.fn(),
      },
    }
    await expect(applyLeadScoreTag(client, {
      accountId: 'account-1',
      tagId: 'tag-hot',
      threshold: 60,
      dryRun: false,
    })).rejects.toThrow('アカウント絞り込み')
    expect(client.friends.addTag).not.toHaveBeenCalled()
  })
})
