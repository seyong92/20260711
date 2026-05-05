import type { PlayerCarryState } from '../entities/Player'

export interface ItemCarryState {
  type: string
  x: number
  y: number
  vx: number
  vy: number
  collectDelayMs: number
}

export interface BossCarryState {
  player?: PlayerCarryState
  items?: ItemCarryState[]
  scrollX?: number
}
