import Phaser from 'phaser'

import { BOSS_CONFIGS } from '../../../content/bosses'
import { scaleDifficultyBossHp, scaleDifficultyCooldown } from '../../../content/difficulty'
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../../constants'
import { BulletPool, ENEMY_BULLET_FRAMES } from '../../systems/BulletPool'

const TRAIN_FRAME_HEIGHT = 64
const TRAIN_VISUAL_BOTTOM = 59
const TRAIN_SCALE = 1.5
const TRAIN_Y = GROUND_Y - (TRAIN_VISUAL_BOTTOM - TRAIN_FRAME_HEIGHT / 2) * TRAIN_SCALE
const TRAIN_STOP_X = GAME_WIDTH * 0.65
const RUSH_RETURN_DELAY = 780
const TRAIN_HITBOX_LEFT_INSET = 25
const TRAIN_HITBOX_RIGHT_INSET = 17
const TRAIN_HITBOX_TOP_INSET = 28
const TRAIN_HITBOX_BOTTOM_INSET = 14
const RUSH_WARNING_DURATION = 1800
const RUSH_WARNING_HEIGHT = 102

type TrainState = 'entering' | 'stopped' | 'retreating' | 'warning' | 'rushing'

export class TrainBoss extends Phaser.Physics.Arcade.Sprite {
  hp: number
  maxHp: number
  private config = BOSS_CONFIGS.train
  private bulletPool: BulletPool
  private lastAttack = 0
  private trainState: TrainState = 'entering'
  private stateTimer = 0
  private rushWarning: Phaser.GameObjects.Text | null = null
  private rushWarningBox: Phaser.GameObjects.Rectangle | null = null
  private signatureIndex = 0
  private hitFlashTween: Phaser.Tweens.Tween | null = null

  constructor(scene: Phaser.Scene, bulletPool: BulletPool) {
    super(scene, GAME_WIDTH + 30, TRAIN_Y, 'boss-train')
    this.bulletPool = bulletPool
    this.hp = scaleDifficultyBossHp(this.config.hp)
    this.maxHp = this.hp
    scene.add.existing(this)
    scene.physics.add.existing(this)
    ;(this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.setSize(86, 34)
    this.setOffset(5, 18)
    this.setDepth(4)
    this.setScale(TRAIN_SCALE)
    this.play('boss-train-idle', true)
    this.startEnterCycle()
  }

  private startEnterCycle() {
    if (!this.active) return
    this.trainState = 'entering'
    this.x = GAME_WIDTH + 60
    this.y = TRAIN_Y
    this.scene.tweens.add({
      targets: this,
      x: TRAIN_STOP_X,
      duration: 1800,
      ease: 'Power1',
      onComplete: () => {
        if (!this.active) return
        this.trainState = 'stopped'
        this.stateTimer = scaleDifficultyCooldown(3500)
        this.lastAttack = this.scene.time.now
      },
    })
  }

  takeDamage(amount: number) {
    if (this.trainState === 'warning') return false
    this.hp -= amount
    this.playHitFlash()
    return this.hp <= 0
  }

  private playHitFlash() {
    this.hitFlashTween?.destroy()
    this.setAlpha(1)
    this.setTintFill(0xffffff)
    this.hitFlashTween = this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.42 },
      duration: 55,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (!this.active) return
        this.clearTint()
        this.setAlpha(1)
        this.hitFlashTween = null
      },
    })
  }

  getHitBounds() {
    if (this.trainState === 'warning') {
      return new Phaser.Geom.Rectangle(GAME_WIDTH + 200, GAME_HEIGHT + 200, 0, 0)
    }
    const visualBounds = this.getBounds()
    if (this.trainState === 'entering' && visualBounds.left > GAME_WIDTH) {
      return new Phaser.Geom.Rectangle(GAME_WIDTH + 200, GAME_HEIGHT + 200, 0, 0)
    }
    return new Phaser.Geom.Rectangle(
      visualBounds.x + TRAIN_HITBOX_LEFT_INSET,
      visualBounds.y + TRAIN_HITBOX_TOP_INSET,
      visualBounds.width - TRAIN_HITBOX_LEFT_INSET - TRAIN_HITBOX_RIGHT_INSET,
      visualBounds.height - TRAIN_HITBOX_TOP_INSET - TRAIN_HITBOX_BOTTOM_INSET,
    )
  }

  getPhaseConfig() {
    const hpRatio = this.hp / this.maxHp
    for (let index = this.config.phases.length - 1; index >= 0; index--) {
      if (hpRatio <= this.config.phases[index].hpThreshold) {
        return this.config.phases[index]
      }
    }

    return this.config.phases[0]
  }

  update(time: number, delta: number) {
    if (!this.active) return
    const phase = this.getPhaseConfig()

    switch (this.trainState) {
      case 'entering':
        break
      case 'stopped':
        this.stateTimer -= delta
        if (time - this.lastAttack > scaleDifficultyCooldown(phase.attackInterval)) {
          this.lastAttack = time
          const pattern =
            this.signatureIndex < phase.patterns.length
              ? phase.patterns[this.signatureIndex++]
              : Phaser.Utils.Array.GetRandom(phase.patterns)
          this.executePattern(pattern, phase.bulletSpeed)
        }
        if (this.stateTimer <= 0) {
          this.startRetreatForRush()
        }
        break
      case 'retreating':
      case 'warning':
      case 'rushing':
        break
    }
  }

  private executePattern(pattern: string, speed: number) {
    this.playAttack()
    switch (pattern) {
      case 'window-shots':
        this.windowShots(speed)
        break
      case 'headlight-sweep':
        this.headlightSweep(speed)
        break
      case 'rail-spark':
      case 'rush-attack':
        break
      case 'radial-burst':
        this.radialBurst(speed)
        break
    }
  }

  private playAttack() {
    this.play('boss-train-attack', true)
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.active) this.play('boss-train-idle', true)
    })
  }

  private startRetreatForRush() {
    if (!this.active) return
    this.trainState = 'retreating'
    this.scene.tweens.add({
      targets: this,
      x: GAME_WIDTH + 80,
      duration: 900,
      ease: 'Sine.easeIn',
      onComplete: () => this.startRushWarning(),
    })
  }

  private startRushWarning() {
    if (!this.active) return
    this.trainState = 'warning'
    this.x = GAME_WIDTH + 90
    this.y = TRAIN_Y
    this.rushWarningBox = this.scene.add
      .rectangle(GAME_WIDTH / 2, TRAIN_Y + 2, GAME_WIDTH, RUSH_WARNING_HEIGHT, 0xe94560, 0.38)
      .setDepth(30)
    this.scene.tweens.add({
      targets: this.rushWarningBox,
      alpha: { from: 0.12, to: 0.62 },
      duration: 250,
      yoyo: true,
      repeat: 5,
    })
    this.rushWarning = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'RUSH!', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ff2f4f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setStroke('#fff1f1', 4)

    this.scene.tweens.add({
      targets: this.rushWarning,
      scale: { from: 0.92, to: 1.12 },
      alpha: { from: 0.68, to: 1 },
      duration: 250,
      yoyo: true,
      repeat: 5,
    })

    this.scene.time.delayedCall(RUSH_WARNING_DURATION, () => {
      if (!this.active) return
      this.trainState = 'rushing'
      this.rushWarning?.destroy()
      this.rushWarning = null
      this.rushWarningBox?.destroy()
      this.rushWarningBox = null
      this.y = TRAIN_Y
      this.x = GAME_WIDTH + 90

      this.scene.tweens.add({
        targets: this,
        x: -140,
        duration: 1050,
        ease: 'Linear',
        onComplete: () => {
          if (!this.active) return
          this.scene.time.delayedCall(scaleDifficultyCooldown(RUSH_RETURN_DELAY), () => {
            if (this.active) {
              this.startEnterCycle()
            }
          })
        },
      })
    })
  }

  private windowShots(speed: number) {
    for (let index = 0; index < 2; index++) {
      this.scene.time.delayedCall(index * 200, () => {
        if (!this.active) return
        const offset = (index - 0.5) * 16
        this.bulletPool.fire(
          this.x - 30,
          this.y + offset,
          -speed,
          offset * 1.2,
          false,
          1,
          false,
          ENEMY_BULLET_FRAMES.orb,
        )
      })
    }
  }

  private headlightSweep(speed: number) {
    for (let index = 0; index < 4; index++) {
      const angle = Math.PI + (index - 1.5) * 0.2
      this.bulletPool.fire(
        this.x - 56,
        this.y - 18,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        false,
        1,
        false,
        ENEMY_BULLET_FRAMES.orb,
      )
    }
  }

  private radialBurst(speed: number) {
    for (let index = 0; index < 3; index++) {
      this.scene.time.delayedCall(index * 150, () => {
        if (!this.active || this.trainState !== 'stopped') return
        const angle = Math.PI - 0.52 + index * 0.52
        this.bulletPool.fire(
          this.x - 44,
          this.y - 8,
          Math.cos(angle) * speed * 0.86,
          Math.sin(angle) * speed * 0.86,
          false,
          1,
          false,
          ENEMY_BULLET_FRAMES.orb,
        )
      })
    }
  }

  override destroy(fromScene?: boolean) {
    this.hitFlashTween?.destroy()
    this.rushWarning?.destroy()
    this.rushWarningBox?.destroy()
    super.destroy(fromScene)
  }
}
