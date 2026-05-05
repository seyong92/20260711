import { POWERUP_MAX_LEVEL } from '../../content/items'
import { getDifficultyConfig } from '../../content/difficulty'

const BASE_MAX_HP = 6
const MAX_HP_CAP = 10

export interface RunSnapshot {
  hp: number
  maxHp: number
  powerLevel: number
  cameraBeamHits: [number, number, number]
  bossHitsTaken: [number, number, number]
  defenseFailures: [number, number, number]
}

class RunState {
  private snapshot: RunSnapshot = {
    hp: BASE_MAX_HP,
    maxHp: BASE_MAX_HP,
    powerLevel: 0,
    cameraBeamHits: [0, 0, 0],
    bossHitsTaken: [0, 0, 0],
    defenseFailures: [0, 0, 0],
  }

  reset() {
    const difficulty = getDifficultyConfig()
    this.snapshot = {
      hp: difficulty.startHp,
      maxHp: difficulty.startMaxHp,
      powerLevel: 0,
      cameraBeamHits: [0, 0, 0],
      bossHitsTaken: [0, 0, 0],
      defenseFailures: [0, 0, 0],
    }
  }

  getSnapshot(): RunSnapshot {
    return {
      ...this.snapshot,
      cameraBeamHits: [...this.snapshot.cameraBeamHits],
      bossHitsTaken: [...this.snapshot.bossHitsTaken],
      defenseFailures: [...this.snapshot.defenseFailures],
    }
  }

  setHp(hp: number) {
    this.snapshot.hp = Math.max(0, Math.min(hp, this.snapshot.maxHp))
  }

  setMaxHp(maxHp: number) {
    this.snapshot.maxHp = Math.max(BASE_MAX_HP, Math.min(maxHp, MAX_HP_CAP))
    this.snapshot.hp = Math.min(this.snapshot.hp, this.snapshot.maxHp)
  }

  increaseMaxHp(amount = 2) {
    this.setMaxHp(this.snapshot.maxHp + amount)
  }

  setPowerLevel(powerLevel: number) {
    this.snapshot.powerLevel = Math.max(0, Math.min(powerLevel, POWERUP_MAX_LEVEL))
  }

  markCameraBeamHit(stageIndex: number) {
    this.incrementStageCounter(this.snapshot.cameraBeamHits, stageIndex)
  }

  markBossHit(stageIndex: number) {
    this.incrementStageCounter(this.snapshot.bossHitsTaken, stageIndex)
  }

  markDefenseFailure(stageIndex: number) {
    this.incrementStageCounter(this.snapshot.defenseFailures, stageIndex)
  }

  hasCameraBeamHit(stageIndex: number) {
    return this.snapshot.cameraBeamHits[stageIndex] > 0
  }

  hasBossHit(stageIndex: number) {
    return this.snapshot.bossHitsTaken[stageIndex] > 0
  }

  hasDefenseFailure(stageIndex: number) {
    return this.snapshot.defenseFailures[stageIndex] > 0
  }

  private incrementStageCounter(counters: [number, number, number], stageIndex: number) {
    if (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex >= counters.length) return
    counters[stageIndex] += 1
  }
}

export const runState = new RunState()
export const RUN_BASE_MAX_HP = BASE_MAX_HP
export const RUN_MAX_HP_CAP = MAX_HP_CAP
