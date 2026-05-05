import { POWERUP_MAX_LEVEL } from '../../content/items'
import { getDifficultyConfig } from '../../content/difficulty'

const BASE_MAX_HP = 3
const MAX_HP_CAP = 5

export interface RunSnapshot {
  hp: number
  maxHp: number
  powerLevel: number
}

class RunState {
  private snapshot: RunSnapshot = {
    hp: BASE_MAX_HP,
    maxHp: BASE_MAX_HP,
    powerLevel: 0,
  }

  reset() {
    const difficulty = getDifficultyConfig()
    this.snapshot = {
      hp: difficulty.startHp,
      maxHp: difficulty.startMaxHp,
      powerLevel: 0,
    }
  }

  getSnapshot(): RunSnapshot {
    return { ...this.snapshot }
  }

  setHp(hp: number) {
    this.snapshot.hp = Math.max(0, Math.min(hp, this.snapshot.maxHp))
  }

  setMaxHp(maxHp: number) {
    this.snapshot.maxHp = Math.max(BASE_MAX_HP, Math.min(maxHp, MAX_HP_CAP))
    this.snapshot.hp = Math.min(this.snapshot.hp, this.snapshot.maxHp)
  }

  increaseMaxHp(amount = 1) {
    this.setMaxHp(this.snapshot.maxHp + amount)
  }

  setPowerLevel(powerLevel: number) {
    this.snapshot.powerLevel = Math.max(0, Math.min(powerLevel, POWERUP_MAX_LEVEL))
  }
}

export const runState = new RunState()
export const RUN_BASE_MAX_HP = BASE_MAX_HP
export const RUN_MAX_HP_CAP = MAX_HP_CAP
