import { gameContent } from '../content/gameContent'
import { isAchievementId, type AchievementId } from '../content/achievements'
import type { AchievementStat, AchievementStatsResponse } from './types'

export type AchievementStatsById = Partial<Record<AchievementId, AchievementStat>>

function getApiBaseUrl() {
  return (import.meta.env.VITE_GAME_SCORE_API_URL ?? gameContent.scoreApi.baseUrl).replace(/\/+$/, '')
}

function shouldUseMock() {
  if (import.meta.env.VITE_GAME_SCORE_API_USE_MOCK) {
    return import.meta.env.VITE_GAME_SCORE_API_USE_MOCK !== 'false'
  }
  return gameContent.scoreApi.useMock
}

function isAchievementStat(value: unknown): value is AchievementStat {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const stat = value as Record<string, unknown>
  return (
    typeof stat.id === 'string' &&
    isAchievementId(stat.id) &&
    typeof stat.name === 'string' &&
    typeof stat.description === 'string' &&
    typeof stat.unlockedCount === 'number' &&
    Number.isFinite(stat.unlockedCount) &&
    typeof stat.participantCount === 'number' &&
    Number.isFinite(stat.participantCount) &&
    typeof stat.unlockRate === 'number' &&
    Number.isFinite(stat.unlockRate)
  )
}

export async function getAchievementStats(): Promise<AchievementStatsById | null> {
  if (shouldUseMock()) return null

  try {
    const response = await fetch(`${getApiBaseUrl()}/v1/achievements/stats`)
    if (!response.ok) return null

    const payload = (await response.json()) as Partial<AchievementStatsResponse>
    if (!Array.isArray(payload.achievements)) return null

    return Object.fromEntries(
      payload.achievements
        .filter(isAchievementStat)
        .map((stat) => [stat.id, stat]),
    ) as AchievementStatsById
  } catch {
    return null
  }
}
