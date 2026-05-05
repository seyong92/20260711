import Phaser from 'phaser'

import { type ItemConfig } from '../../content/items'
import { getSelectedPlayerCharacter } from '../systems/PlayerSelection'
import { GAME_WIDTH, GROUND_Y, ITEM_MIN_Y } from '../constants'

const MIN_X = 16
const MAX_X = GAME_WIDTH - 16
const MAX_Y = GROUND_Y - 8
export const DROPPED_ITEM_VISIBLE_MS = 8000
export const DROPPED_ITEM_FADE_MS = 500
const ITEM_BASE_SCALES: Record<string, number> = {
  heart: 0.76,
  coin: 0.78,
  powerup: 0.9,
  star: 0.78,
}
const ITEM_FRAME_BASE: Record<string, number> = {
  heart: 0,
  coin: 2,
  powerup: 4,
  star: 6,
}

function getItemFrameBase(type: string, fallback: number) {
  if (type === 'powerup' && getSelectedPlayerCharacter() === 'dragon') return 8
  return ITEM_FRAME_BASE[type] ?? fallback
}

function getItemAnimationKey(type: string) {
  if (type === 'powerup' && getSelectedPlayerCharacter() === 'dragon') return 'item-powerup-dragon'
  return `item-${type}`
}

function getItemBaseScale(type: string) {
  if (type === 'powerup' && getSelectedPlayerCharacter() === 'dragon') return 0.92
  return ITEM_BASE_SCALES[type] ?? 1
}

export class Item extends Phaser.Physics.Arcade.Sprite {
  itemConfig: ItemConfig
  private vx: number
  private vy: number
  private collectableAt = 0

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: ItemConfig,
    initialVelocity?: { vx: number; vy: number },
    collectDelayMs = 0,
  ) {
    super(scene, x, y, 'item-pickups', getItemFrameBase(config.type, config.frame))
    this.itemConfig = config
    scene.add.existing(this)
    scene.physics.add.existing(this)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.moves = false
    const baseScale = getItemBaseScale(config.type)
    this.setScale(baseScale)
    this.setSize(20, 20)
    this.setOffset(6, 6)
    this.setDepth(3)
    this.play(getItemAnimationKey(config.type), true)
    this.vx = initialVelocity?.vx ?? -(120 + Math.random() * 60)
    this.vy = initialVelocity?.vy ?? (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 40)
    this.collectableAt = scene.time.now + collectDelayMs

    scene.tweens.add({
      targets: this,
      scale: { from: baseScale, to: baseScale * 1.18 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    scene.time.delayedCall(DROPPED_ITEM_VISIBLE_MS, () => {
      if (!this.active) return
      scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: DROPPED_ITEM_FADE_MS,
        onComplete: () => {
          if (this.active) this.destroy()
        },
      })
    })
  }

  update(_time: number, delta: number) {
    if (!this.active) return

    const dt = delta / 1000
    this.x += this.vx * dt
    this.y += this.vy * dt

    if (this.x <= MIN_X) {
      this.x = MIN_X + 1
      this.vx = Math.abs(this.vx)
    } else if (this.x >= MAX_X) {
      this.x = MAX_X - 1
      this.vx = -Math.abs(this.vx)
    }

    if (this.y <= ITEM_MIN_Y) {
      this.y = ITEM_MIN_Y + 1
      this.vy = Math.abs(this.vy)
    } else if (this.y >= MAX_Y) {
      this.y = MAX_Y - 1
      this.vy = -Math.abs(this.vy)
    }

    if (this.body) {
      ;(this.body as Phaser.Physics.Arcade.Body).updateFromGameObject()
    }
  }

  canBeCollected() {
    return this.scene.time.now >= this.collectableAt
  }

  getCarryState() {
    return {
      type: this.itemConfig.type,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      collectDelayMs: Math.max(0, this.collectableAt - this.scene.time.now),
    }
  }
}
