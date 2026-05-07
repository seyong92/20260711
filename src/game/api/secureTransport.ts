import type { DifficultyId } from '../content/difficulty'
import { gameContent } from '../content/gameContent'
import type { GameProgress } from '../core/systems/ProgressStorage'
import type { PlayerCharacterId } from '../core/systems/PlayerSelection'
import type { EncryptedEnvelope, StartRunResponse } from './types'

const PEPPER_PARTS = ['wedding', '20260711', 'run', 'envelope', 'v1']
const INITIAL_HASH = '0'
const CLIENT_VERSION = import.meta.env.VITE_GAME_CLIENT_VERSION ?? '20260711-web-v1'

interface RunSession {
  userId: string
  runId: string
  serverNonce: string
  character: PlayerCharacterId
  difficulty: DifficultyId
  currentHash: string
  lastSeq: number
  startedAt: number
}

type JsonValue = unknown

interface QueueEvent {
  eventType: string
  payload: Record<string, JsonValue>
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

function getPepper() {
  return PEPPER_PARTS.join('-')
}

function normalizeJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map((item) => normalizeJson(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, JsonValue>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalizeJson(item)]),
    )
  }
  return value
}

function canonicalJson(value: JsonValue) {
  return JSON.stringify(normalizeJson(value))
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function deriveAesKey(session: RunSession) {
  const material = `${getPepper()}:${session.serverNonce}:${session.userId}:${session.runId}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material))
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt'])
}

async function encryptPayload(session: RunSession, payload: JsonValue): Promise<EncryptedEnvelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveAesKey(session)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(canonicalJson(payload)),
  )
  return {
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
  }
}

async function computeEventHash(
  session: RunSession,
  seq: number,
  prevHash: string,
  eventType: string,
  payload: Record<string, JsonValue>,
) {
  return sha256Hex(
    canonicalJson({
      eventType,
      payload,
      pepper: getPepper(),
      prevHash,
      runId: session.runId,
      seq,
      serverNonce: session.serverNonce,
      version: 1,
    }),
  )
}

class SecureGameTransport {
  private session: RunSession | null = null
  private pendingEvents: QueueEvent[] = []
  private flushTimer: number | null = null
  private flushPromise: Promise<void> | null = null

  isEnabled() {
    return !shouldUseMock() && typeof window !== 'undefined' && !!crypto.subtle
  }

  getRunId() {
    return this.session?.runId ?? ''
  }

  getCurrentHash() {
    return this.session?.currentHash ?? ''
  }

  async startRun(userId: string, character: PlayerCharacterId, difficulty: DifficultyId, forceNew = false) {
    if (!this.isEnabled()) return null
    if (
      !forceNew &&
      this.session?.userId === userId &&
      this.session.character === character &&
      this.session.difficulty === difficulty
    ) {
      return this.session
    }
    const response = await fetch(`${getApiBaseUrl()}/v1/runs/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        clientVersion: CLIENT_VERSION,
        character,
        difficulty,
      }),
    })
    if (!response.ok) throw new Error(`Failed to start secure run: ${response.status}`)
    const data = (await response.json()) as StartRunResponse
    this.pendingEvents = []
    this.session = {
      userId,
      runId: data.runId,
      serverNonce: data.serverNonce,
      character,
      difficulty,
      currentHash: INITIAL_HASH,
      lastSeq: 0,
      startedAt: Date.now(),
    }
    return this.session
  }

  queueEvent(eventType: string, payload: Record<string, JsonValue> = {}) {
    if (!this.isEnabled() || !this.session) return
    this.pendingEvents.push({ eventType, payload })
    this.scheduleFlush()
  }

  async flushEvents() {
    if (!this.isEnabled() || !this.session) return
    if (this.flushPromise) {
      await this.flushPromise
      if (this.pendingEvents.length === 0) return
    }
    if (this.pendingEvents.length === 0) return

    this.flushPromise = this.flushPendingEvents()
    try {
      await this.flushPromise
    } finally {
      this.flushPromise = null
    }

    if (this.pendingEvents.length > 0) {
      await this.flushEvents()
    }
  }

  private async flushPendingEvents() {
    if (!this.session || this.pendingEvents.length === 0) return
    const session = this.session
    const batch = this.pendingEvents.splice(0)
    const events = []
    let prevHash = session.currentHash
    let seq = session.lastSeq
    for (const event of batch) {
      seq += 1
      const eventHash = await computeEventHash(session, seq, prevHash, event.eventType, event.payload)
      events.push({
        seq,
        prevHash,
        eventHash,
        eventType: event.eventType,
        payload: event.payload,
        clientTimeDeltaMs: Math.max(0, Date.now() - session.startedAt),
      })
      prevHash = eventHash
    }
    const envelope = await encryptPayload(session, { events })
    const response = await fetch(`${getApiBaseUrl()}/v1/runs/${session.runId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.userId, envelope }),
    })
    if (!response.ok) throw new Error(`Failed to submit secure events: ${response.status}`)
    const result = (await response.json()) as { currentHash: string; lastSeq: number }
    session.currentHash = result.currentHash
    session.lastSeq = result.lastSeq
  }

  async syncProgress(progress: GameProgress, displayName?: string) {
    if (!this.isEnabled() || !this.session) return
    const envelope = await encryptPayload(this.session, {
      displayName: displayName ?? null,
      dragonModeUnlocked: progress.dragonModeUnlocked,
      unlockedAchievementIds: progress.unlockedAchievementIds,
      modes: progress.modes,
    })
    await fetch(`${getApiBaseUrl()}/v1/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: this.session.userId,
        runId: this.session.runId,
        envelope,
      }),
    })
  }

  async buildScoreEnvelope(payload: JsonValue) {
    if (!this.isEnabled() || !this.session) return null
    return {
      userId: this.session.userId,
      runId: this.session.runId,
      envelope: await encryptPayload(this.session, payload),
    }
  }

  private scheduleFlush() {
    if (this.flushTimer !== null) return
    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = null
      this.flushEvents().catch(() => {
        // A later score submit/sync attempt can surface the failure. Gameplay should not halt here.
      })
    }, 500)
  }
}

export const secureGameTransport = new SecureGameTransport()
