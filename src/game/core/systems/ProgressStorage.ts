import type { DifficultyId } from '../../content/difficulty'
import {
  ACHIEVEMENTS,
  getStageClearAchievementIds,
  isAchievementId,
  type AchievementId,
} from '../../content/achievements'
import type { PlayerCharacterId } from './PlayerSelection'

const STORAGE_KEY = '__ygp0'
const STORAGE_VERSION = 2
const LEGACY_STORAGE_VERSION = 1
const STAGE_COUNT = 3
const MAX_COUNTER = 999_999_999
const SIGNATURE_SALT = 'yongsang-eunjin-progress-v1'
const OBFUSCATION_KEY = 'dragon-bride-2026-local-progress'

export const PROGRESS_TAMPER_EVENT = 'wedding-game-progress-reset'

type CompactDifficultyProgress = [number, number, number, number, number]

interface CompactProgressPayloadV1 {
  v: typeof LEGACY_STORAGE_VERSION
  u: string
  b: {
    e: CompactDifficultyProgress
    h: CompactDifficultyProgress
  }
  d: {
    e: CompactDifficultyProgress
    h: CompactDifficultyProgress
  }
}

interface CompactProgressPayloadV2 {
  v: typeof STORAGE_VERSION
  u: string
  b: {
    e: CompactDifficultyProgress
    h: CompactDifficultyProgress
  }
  d: {
    e: CompactDifficultyProgress
    h: CompactDifficultyProgress
  }
  a: AchievementId[]
  g: 0 | 1
}

type CompactProgressPayload = CompactProgressPayloadV1 | CompactProgressPayloadV2

interface CompactProgressEnvelope {
  p: CompactProgressPayload
  s: string
}

export interface DifficultyProgress {
  attempts: number
  stageClears: [number, number, number]
  highScore: number
}

export type GameProgress = {
  userId: string
  modes: Record<PlayerCharacterId, Record<DifficultyId, DifficultyProgress>>
  unlockedAchievementIds: AchievementId[]
  dragonModeUnlocked: boolean
}

type LoadResult = {
  progress: GameProgress
  tampered: boolean
}

class ProgressStorage {
  private progress: GameProgress | null = null
  private initialized = false

  initialize(): LoadResult {
    const result = this.load()
    this.progress = result.progress
    this.initialized = true
    if (result.tampered) {
      this.dispatchTamperWarning()
    }
    return result
  }

  getSnapshot(): GameProgress {
    return this.cloneProgress(this.ensureProgress())
  }

  getUserId() {
    return this.ensureProgress().userId
  }

  recordAttempt(character: PlayerCharacterId, difficulty: DifficultyId) {
    this.updateProgress((progress) => {
      const slot = progress.modes[character][difficulty]
      slot.attempts = this.incrementCounter(slot.attempts)
    })
  }

  recordStageClear(character: PlayerCharacterId, difficulty: DifficultyId, stageIndex: number) {
    if (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex >= STAGE_COUNT) return []
    const achievements = getStageClearAchievementIds(character, difficulty, stageIndex)
    return this.updateProgress((progress) => {
      const slot = progress.modes[character][difficulty]
      slot.stageClears[stageIndex] = this.incrementCounter(slot.stageClears[stageIndex])
      return this.addUnlockedAchievements(progress, achievements)
    })
  }

  unlockAchievements(ids: AchievementId[]) {
    if (ids.length === 0) return []
    return this.updateProgress((progress) => this.addUnlockedAchievements(progress, ids))
  }

  recordDragonModeUnlocked() {
    this.updateProgress((progress) => {
      progress.dragonModeUnlocked = true
    })
  }

  isDragonModeUnlocked() {
    return this.ensureProgress().dragonModeUnlocked
  }

  recordHighScore(character: PlayerCharacterId, difficulty: DifficultyId, score: number) {
    if (!Number.isFinite(score) || score < 0) return
    this.updateProgress((progress) => {
      const slot = progress.modes[character][difficulty]
      slot.highScore = Math.max(slot.highScore, Math.floor(score))
    })
  }

  private addUnlockedAchievements(progress: GameProgress, ids: AchievementId[]) {
    const newlyUnlocked: AchievementId[] = []
    ids.forEach((id) => {
      if (progress.unlockedAchievementIds.includes(id)) return
      progress.unlockedAchievementIds.push(id)
      newlyUnlocked.push(id)
    })
    return newlyUnlocked
  }

  private updateProgress<T = void>(mutator: (progress: GameProgress) => T): T {
    const progress = this.ensureProgress()
    const result = mutator(progress)
    this.save(progress)
    return result
  }

  private ensureProgress(): GameProgress {
    if (!this.initialized || !this.progress) {
      this.initialize()
    }
    return this.progress ?? this.createDefaultProgress()
  }

  private load(): LoadResult {
    const stored = this.readStoredValue()
    if (!stored) {
      const progress = this.createDefaultProgress()
      this.save(progress)
      return { progress, tampered: false }
    }

    try {
      const envelope = JSON.parse(this.decodeStoredValue(stored)) as CompactProgressEnvelope
      if (!this.isValidEnvelope(envelope)) {
        throw new Error('Invalid progress envelope')
      }
      const progress = this.expandPayload(envelope.p)
      if (envelope.p.v !== STORAGE_VERSION) {
        this.save(progress)
      }
      return { progress, tampered: false }
    } catch {
      const progress = this.createDefaultProgress()
      this.save(progress)
      return { progress, tampered: true }
    }
  }

  private save(progress: GameProgress) {
    const payload = this.compactProgress(progress)
    const envelope: CompactProgressEnvelope = {
      p: payload,
      s: this.createSignature(payload),
    }
    this.writeStoredValue(this.encodeStoredValue(JSON.stringify(envelope)))
  }

  private readStoredValue() {
    try {
      return window.localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  }

  private writeStoredValue(value: string) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // The game can still run without persistence when browser storage is unavailable.
    }
  }

  private createDefaultProgress(): GameProgress {
    return {
      userId: this.createUserId(),
      modes: {
        bride: {
          easy: this.createEmptyDifficultyProgress(),
          hard: this.createEmptyDifficultyProgress(),
        },
        dragon: {
          easy: this.createEmptyDifficultyProgress(),
          hard: this.createEmptyDifficultyProgress(),
        },
      },
      unlockedAchievementIds: [],
      dragonModeUnlocked: false,
    }
  }

  private createEmptyDifficultyProgress(): DifficultyProgress {
    return {
      attempts: 0,
      stageClears: [0, 0, 0],
      highScore: 0,
    }
  }

  private createUserId() {
    if (crypto.randomUUID) return crypto.randomUUID()
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  private compactProgress(progress: GameProgress): CompactProgressPayloadV2 {
    return {
      v: STORAGE_VERSION,
      u: progress.userId,
      b: {
        e: this.compactDifficultyProgress(progress.modes.bride.easy),
        h: this.compactDifficultyProgress(progress.modes.bride.hard),
      },
      d: {
        e: this.compactDifficultyProgress(progress.modes.dragon.easy),
        h: this.compactDifficultyProgress(progress.modes.dragon.hard),
      },
      a: [...progress.unlockedAchievementIds],
      g: progress.dragonModeUnlocked ? 1 : 0,
    }
  }

  private compactDifficultyProgress(progress: DifficultyProgress): CompactDifficultyProgress {
    return [
      progress.attempts,
      progress.stageClears[0],
      progress.stageClears[1],
      progress.stageClears[2],
      progress.highScore,
    ]
  }

  private expandPayload(payload: CompactProgressPayload): GameProgress {
    const progress: GameProgress = {
      userId: payload.u,
      modes: {
        bride: {
          easy: this.expandDifficultyProgress(payload.b.e),
          hard: this.expandDifficultyProgress(payload.b.h),
        },
        dragon: {
          easy: this.expandDifficultyProgress(payload.d.e),
          hard: this.expandDifficultyProgress(payload.d.h),
        },
      },
      unlockedAchievementIds: payload.v === STORAGE_VERSION ? payload.a.filter(isAchievementId) : [],
      dragonModeUnlocked: payload.v === STORAGE_VERSION ? payload.g === 1 : false,
    }
    this.backfillStageClearAchievements(progress)
    return progress
  }

  private expandDifficultyProgress(progress: CompactDifficultyProgress): DifficultyProgress {
    return {
      attempts: progress[0],
      stageClears: [progress[1], progress[2], progress[3]],
      highScore: progress[4],
    }
  }

  private isValidEnvelope(value: unknown): value is CompactProgressEnvelope {
    if (!this.isRecord(value) || !this.isRecord(value.p) || typeof value.s !== 'string') return false
    const payload = value.p
    if (
      (payload.v !== STORAGE_VERSION && payload.v !== LEGACY_STORAGE_VERSION) ||
      typeof payload.u !== 'string' ||
      !this.isUuid4(payload.u)
    ) {
      return false
    }
    if (!this.isRecord(payload.b) || !this.isRecord(payload.d)) return false
    if (!this.isValidModePayload(payload.b) || !this.isValidModePayload(payload.d)) return false
    if (payload.v === STORAGE_VERSION) {
      if (!Array.isArray(payload.a) || !payload.a.every((id) => typeof id === 'string' && isAchievementId(id))) {
        return false
      }
      if (payload.g !== 0 && payload.g !== 1) return false
    }
    const compactPayload: CompactProgressPayload =
      payload.v === STORAGE_VERSION
        ? {
            v: STORAGE_VERSION,
            u: payload.u,
            b: payload.b,
            d: payload.d,
            a: payload.a as AchievementId[],
            g: payload.g as 0 | 1,
          }
        : {
            v: LEGACY_STORAGE_VERSION,
            u: payload.u,
            b: payload.b,
            d: payload.d,
          }
    return value.s === this.createSignature(compactPayload)
  }

  private isValidModePayload(value: Record<string, unknown>): value is CompactProgressPayload['b'] {
    return this.isValidDifficultyPayload(value.e) && this.isValidDifficultyPayload(value.h)
  }

  private isValidDifficultyPayload(value: unknown): value is CompactDifficultyProgress {
    return Array.isArray(value) && value.length === 5 && value.every((item) => this.isValidCounter(item))
  }

  private isValidCounter(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_COUNTER
  }

  private isUuid4(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  }

  private createSignature(payload: CompactProgressPayload) {
    let hash = 0x811c9dc5
    const text = `${SIGNATURE_SALT}:${JSON.stringify(payload)}`
    for (let index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return hash.toString(36)
  }

  private encodeStoredValue(value: string) {
    const textBytes = new TextEncoder().encode(value)
    const keyBytes = new TextEncoder().encode(OBFUSCATION_KEY)
    const encoded = textBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length] ^ ((index * 17) & 0xff))
    return this.bytesToBase64Url(encoded)
  }

  private decodeStoredValue(value: string) {
    const dataBytes = this.base64UrlToBytes(value)
    const keyBytes = new TextEncoder().encode(OBFUSCATION_KEY)
    const decoded = dataBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length] ^ ((index * 17) & 0xff))
    return new TextDecoder().decode(decoded)
  }

  private bytesToBase64Url(bytes: Uint8Array) {
    let binary = ''
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  private base64UrlToBytes(value: string) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const binary = atob(padded)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
  }

  private incrementCounter(value: number) {
    return Math.min(MAX_COUNTER, value + 1)
  }

  private backfillStageClearAchievements(progress: GameProgress) {
    ;(['bride', 'dragon'] as const).forEach((character) => {
      ;(['easy', 'hard'] as const).forEach((difficulty) => {
        progress.modes[character][difficulty].stageClears.forEach((clears, stageIndex) => {
          if (clears <= 0) return
          this.addUnlockedAchievements(progress, getStageClearAchievementIds(character, difficulty, stageIndex))
        })
      })
    })
    progress.unlockedAchievementIds = ACHIEVEMENTS
      .map((achievement) => achievement.id)
      .filter((id) => progress.unlockedAchievementIds.includes(id))
  }

  private cloneProgress(progress: GameProgress): GameProgress {
    return {
      userId: progress.userId,
      modes: {
        bride: {
          easy: this.cloneDifficultyProgress(progress.modes.bride.easy),
          hard: this.cloneDifficultyProgress(progress.modes.bride.hard),
        },
        dragon: {
          easy: this.cloneDifficultyProgress(progress.modes.dragon.easy),
          hard: this.cloneDifficultyProgress(progress.modes.dragon.hard),
        },
      },
      unlockedAchievementIds: [...progress.unlockedAchievementIds],
      dragonModeUnlocked: progress.dragonModeUnlocked,
    }
  }

  private cloneDifficultyProgress(progress: DifficultyProgress): DifficultyProgress {
    return {
      attempts: progress.attempts,
      stageClears: [...progress.stageClears],
      highScore: progress.highScore,
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  private dispatchTamperWarning() {
    window.dispatchEvent(new CustomEvent(PROGRESS_TAMPER_EVENT))
  }
}

export const progressStorage = new ProgressStorage()
