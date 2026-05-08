import type { DifficultyId } from '../content/difficulty'
import type { PlayerCharacterId } from '../core/systems/PlayerSelection'

export interface ScoreSubmission {
  userId: string
  runId: string
  playerName: string
  score: number
  message: string
  playTimeSeconds: number
  difficulty: DifficultyId
  character: PlayerCharacterId
  finalEventHash: string
  timestamp: number
}

export interface EncryptedEnvelope {
  iv: string
  ciphertext: string
}

export interface StartRunRequest {
  userId: string
  clientVersion: string
  character: PlayerCharacterId
  difficulty: DifficultyId
}

export interface StartRunResponse {
  runId: string
  serverNonce: string
  expiresAt: string
}

export interface SecureSubmitRequest {
  userId: string
  runId: string
  envelope: EncryptedEnvelope
}

export interface ScoreEntry {
  id: string
  playerName: string
  score: number
  message: string
  playTimeSeconds: number
  difficulty: DifficultyId
  character: PlayerCharacterId
  createdAt: string
}

export interface LeaderboardResponse {
  entries: ScoreEntry[]
  totalCount: number
}

export interface AchievementStat {
  id: string
  name: string
  description: string
  unlockedCount: number
  participantCount: number
  unlockRate: number
}

export interface AchievementStatsResponse {
  achievements: AchievementStat[]
}

export interface SubmitResponse {
  success: boolean
  rank: number
  entry: ScoreEntry
}
