import type { DifficultyId } from '../content/difficulty'
import { gameContent } from '../content/gameContent'
import type { LeaderboardResponse, ScoreEntry, ScoreSubmission, SubmitResponse } from './types'
import { secureGameTransport } from './secureTransport'

const LOCAL_STORAGE_KEY = 'wedding-game-scoreboard-v1'
const STORAGE_VERSION = 1
const DEFAULT_REMOTE_LEADERBOARD_LIMIT = 100
const DEFAULT_LOCAL_ENTRIES: ScoreEntry[] = [
  {
    id: 'default-easy-bride',
    playerName: '첫 용사',
    score: 4800,
    message: 'Easy 테스트 기록입니다.',
    playTimeSeconds: 210,
    difficulty: 'easy',
    character: 'bride',
    createdAt: '2026-05-06T00:00:00.000Z',
  },
  {
    id: 'default-normal-dragon',
    playerName: '첫 용',
    score: 9600,
    message: 'Normal 테스트 기록입니다.',
    playTimeSeconds: 185,
    difficulty: 'normal',
    character: 'dragon',
    createdAt: '2026-05-06T00:01:00.000Z',
  },
  {
    id: 'default-hard-bride',
    playerName: '하드 용사',
    score: 14400,
    message: 'Hard 테스트 기록입니다.',
    playTimeSeconds: 240,
    difficulty: 'hard',
    character: 'bride',
    createdAt: '2026-05-06T00:02:00.000Z',
  },
]

interface LocalScoreboardPayload {
  version: typeof STORAGE_VERSION
  entries: ScoreEntry[]
}

function getApiBaseUrl() {
  return (import.meta.env.VITE_GAME_SCORE_API_URL ?? gameContent.scoreApi.baseUrl).replace(/\/+$/, '')
}

function shouldUseMock() {
  if (import.meta.env.VITE_GAME_SCORE_API_USE_MOCK) {
    return import.meta.env.VITE_GAME_SCORE_API_USE_MOCK !== 'false'
  }
  return gameContent.scoreApi.useMock
}

function createEntryId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function compareScoreEntries(a: ScoreEntry, b: ScoreEntry) {
  if (b.score !== a.score) return b.score - a.score
  if (a.playTimeSeconds !== b.playTimeSeconds) return a.playTimeSeconds - b.playTimeSeconds
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

function isScoreEntry(value: unknown): value is ScoreEntry {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.id === 'string' &&
    typeof entry.playerName === 'string' &&
    typeof entry.message === 'string' &&
    typeof entry.score === 'number' &&
    Number.isFinite(entry.score) &&
    typeof entry.playTimeSeconds === 'number' &&
    Number.isFinite(entry.playTimeSeconds) &&
    (entry.difficulty === 'easy' || entry.difficulty === 'normal' || entry.difficulty === 'hard') &&
    (entry.character === 'bride' || entry.character === 'dragon') &&
    typeof entry.createdAt === 'string'
  )
}

function readLocalScoreboard(): ScoreEntry[] {
  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!stored) {
      writeLocalScoreboard(DEFAULT_LOCAL_ENTRIES)
      return DEFAULT_LOCAL_ENTRIES
    }
    const payload = JSON.parse(stored) as Partial<LocalScoreboardPayload>
    if (payload.version !== STORAGE_VERSION || !Array.isArray(payload.entries)) return []
    return payload.entries.filter(isScoreEntry)
  } catch {
    return []
  }
}

function writeLocalScoreboard(entries: ScoreEntry[]) {
  try {
    const payload: LocalScoreboardPayload = {
      version: STORAGE_VERSION,
      entries,
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // The game can still show the submitted run even if browser storage is unavailable.
  }
}

export async function submitScore(data: ScoreSubmission): Promise<SubmitResponse> {
  if (shouldUseMock()) {
    const entry: ScoreEntry = {
      id: createEntryId(),
      playerName: data.playerName,
      score: Math.max(0, Math.floor(data.score)),
      message: data.message,
      playTimeSeconds: Math.max(0, Math.floor(data.playTimeSeconds)),
      difficulty: data.difficulty,
      character: data.character,
      createdAt: new Date().toISOString(),
    }
    const entries = [...readLocalScoreboard(), entry].sort(compareScoreEntries)
    writeLocalScoreboard(entries)
    const difficultyEntries = entries.filter((record) => record.difficulty === entry.difficulty)
    const rank = difficultyEntries.findIndex((record) => record.id === entry.id) + 1
    return { success: true, rank, entry }
  }

  await secureGameTransport.flushEvents()
  const securePayload = await secureGameTransport.buildScoreEnvelope({
    playerName: data.playerName,
    score: data.score,
    message: data.message,
    playTimeSeconds: data.playTimeSeconds,
    difficulty: data.difficulty,
    character: data.character,
    timestamp: data.timestamp,
    finalEventHash: secureGameTransport.getCurrentHash() || data.finalEventHash,
  })
  if (!securePayload) {
    throw new Error('Secure score transport is unavailable')
  }

  const response = await fetch(`${getApiBaseUrl()}/v1/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(securePayload),
  })

  if (!response.ok) {
    let detail = `Score submission failed: ${response.status}`
    try {
      const payload = (await response.json()) as { detail?: unknown }
      if (typeof payload.detail === 'string') {
        detail = payload.detail
      }
    } catch {
      // Keep the status-based message if the server did not return JSON.
    }
    throw new Error(detail)
  }

  return response.json()
}

export async function getLeaderboard(difficulty: DifficultyId, limit?: number): Promise<LeaderboardResponse> {
  if (shouldUseMock()) {
    const entries = readLocalScoreboard()
      .filter((entry) => entry.difficulty === difficulty)
      .sort(compareScoreEntries)
    return {
      entries: typeof limit === 'number' ? entries.slice(0, limit) : entries,
      totalCount: entries.length,
    }
  }

  const params = new URLSearchParams({
    difficulty,
    limit: String(limit ?? DEFAULT_REMOTE_LEADERBOARD_LIMIT),
  })
  const response = await fetch(`${getApiBaseUrl()}/v1/scores/top?${params.toString()}`)
  return response.json()
}
