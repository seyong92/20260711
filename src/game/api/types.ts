export interface ScoreSubmission {
  playerName: string
  score: number
  message: string
  playTimeSeconds: number
  checksum: string
  timestamp: number
}

export interface ScoreEntry {
  id: string
  playerName: string
  score: number
  message: string
  playTimeSeconds: number
  createdAt: string
}

export interface LeaderboardResponse {
  entries: ScoreEntry[]
  totalCount: number
}

export interface SubmitResponse {
  success: boolean
  rank: number
  entry: ScoreEntry
}
