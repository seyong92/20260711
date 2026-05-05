import { gameContent } from '../content/gameContent'
import type { LeaderboardResponse, ScoreSubmission, SubmitResponse } from './types'

const mockEntries = [
  {
    id: '1',
    playerName: '용감한토끼',
    score: 15000,
    message: '결혼 축하해요!',
    playTimeSeconds: 180,
    createdAt: '2026-05-01T12:00:00Z',
  },
  {
    id: '2',
    playerName: '별빛사슴',
    score: 12500,
    message: '행복하세요~',
    playTimeSeconds: 210,
    createdAt: '2026-05-01T11:00:00Z',
  },
  {
    id: '3',
    playerName: '꽃구름',
    score: 11000,
    message: '축하축하!',
    playTimeSeconds: 195,
    createdAt: '2026-05-01T10:00:00Z',
  },
]

function getApiBaseUrl() {
  return import.meta.env.VITE_GAME_SCORE_API_URL ?? gameContent.scoreApi.baseUrl
}

function shouldUseMock() {
  return gameContent.scoreApi.useMock
}

export async function submitScore(data: ScoreSubmission): Promise<SubmitResponse> {
  if (shouldUseMock()) {
    const entry = {
      id: String(Date.now()),
      playerName: data.playerName,
      score: data.score,
      message: data.message,
      playTimeSeconds: data.playTimeSeconds,
      createdAt: new Date().toISOString(),
    }
    mockEntries.push(entry)
    mockEntries.sort((a, b) => b.score - a.score)
    const rank = mockEntries.findIndex((record) => record.id === entry.id) + 1
    return { success: true, rank, entry }
  }

  const response = await fetch(`${getApiBaseUrl()}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  return response.json()
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardResponse> {
  if (shouldUseMock()) {
    return {
      entries: mockEntries.slice(0, limit),
      totalCount: mockEntries.length,
    }
  }

  const response = await fetch(`${getApiBaseUrl()}/scores/top?limit=${limit}`)
  return response.json()
}
