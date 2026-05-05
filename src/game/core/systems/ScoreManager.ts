import { getDifficultyConfig } from '../../content/difficulty'

export class ScoreManager {
  private score = 0
  private startTime = 0

  reset() {
    this.score = 0
    this.startTime = Date.now()
  }

  getScore() {
    return this.score
  }

  getPlayTime() {
    return Date.now() - this.startTime
  }

  private scalePoints(points: number) {
    return Math.round(points * getDifficultyConfig().scoreMultiplier)
  }

  addKill() {
    this.score += this.scalePoints(100)
  }

  addBossKill() {
    this.score += this.scalePoints(3000)
  }

  addCoin() {
    this.score += this.scalePoints(500)
  }

  addPoints(points: number) {
    this.score += this.scalePoints(points)
  }

  addClearBonus() {
    this.score += this.scalePoints(5000)
  }

  penalizeHit() {
    this.score = Math.max(0, this.score - 200)
  }

  penalizeDeath() {
    this.score = Math.max(0, this.score - 1000)
  }
}

export const scoreManager = new ScoreManager()
