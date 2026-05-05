import Phaser from 'phaser'

import { BOSS_CONFIGS } from '../../../content/bosses'
import {
  getDifficultyConfig,
  scaleDifficultyBossHp,
  scaleDifficultyCooldown,
} from '../../../content/difficulty'
import { GAME_WIDTH, GROUND_Y } from '../../constants'
import { BulletPool, ENEMY_BULLET_FRAMES } from '../../systems/BulletPool'

const PIANO_Y = GROUND_Y - 42
const RECITAL_X = GAME_WIDTH * 0.58
const RECITAL_Y = GROUND_Y - 112
const BOUQUET_CHARGE_MS = 1000
const BOUQUET_REPOSITION_MIN_X = GAME_WIDTH * 0.55
const BOUQUET_REPOSITION_MAX_X = GAME_WIDTH - 72
const BOUQUET_REPOSITION_MS = 360
const BOUQUET_EXPLODE_MS = 760
const BOUQUET_SECOND_BURST_DELAY_MS = 800
const BOUQUET_BURST_COUNT = 6
const BOUQUET_FLOWER_SPEED_RATIO = 0.52
const BOUQUET_FLOWER_TINTS = [0xffffff, 0xffb7d5, 0xfff0a8, 0xb8f7ff, 0xc8ffc6, 0xd7c3ff] as const
const BOUQUET_SHIELD_WIDTH = 118
const BOUQUET_SHIELD_HEIGHT = 100
const BOUQUET_SHIELD_OFFSET_X = -2
const BOUQUET_SHIELD_OFFSET_Y = 1
const PIANO_PATTERN_RECOVERY: Record<string, number> = {
  'key-wave': 360,
  'note-fan': 360,
  'crescendo-drop': 620,
  'grand-recital': 0,
  'bouquet-shot': 1900,
}

type PianoState = 'entering' | 'idle' | 'gliding' | 'recital' | 'bouquet'

export class PianoBoss extends Phaser.Physics.Arcade.Sprite {
  hp: number
  maxHp: number
  private config = BOSS_CONFIGS.piano
  private bulletPool: BulletPool
  private lastAttack = 0
  private bossState: PianoState = 'entering'
  private glideDirection = -1
  private stateTimer = 0
  private hitFlashTween: Phaser.Tweens.Tween | null = null
  private bouquetChargeVisual: Phaser.GameObjects.Sprite | null = null
  private bouquetShieldVisual: Phaser.GameObjects.Ellipse | null = null
  private bouquetShieldTween: Phaser.Tweens.Tween | null = null
  private damageImmune = false

  constructor(scene: Phaser.Scene, bulletPool: BulletPool) {
    super(scene, GAME_WIDTH + 40, PIANO_Y, 'boss-piano')
    this.bulletPool = bulletPool
    this.hp = scaleDifficultyBossHp(this.config.hp)
    this.maxHp = this.hp
    scene.add.existing(this)
    scene.physics.add.existing(this)
    ;(this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.setSize(52, 34)
    this.setOffset(4, 10)
    this.setDepth(4)
    this.setScale(1.45)
    this.play('boss-piano-idle', true)

    scene.tweens.add({
      targets: this,
      x: GAME_WIDTH - 90,
      duration: 1100,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (!this.active) return
        this.bossState = 'idle'
        this.stateTimer = 1000
      },
    })
  }

  takeDamage(amount: number) {
    if (this.damageImmune) return false
    this.hp -= amount
    this.playHitFlash()
    return this.hp <= 0
  }

  isDamageImmune() {
    return this.damageImmune
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
    const bounds = this.getBounds()
    return new Phaser.Geom.Rectangle(bounds.x + 14, bounds.y + 22, bounds.width - 28, bounds.height - 34)
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
    if (!this.active || this.bossState === 'entering' || this.bossState === 'recital' || this.bossState === 'bouquet') return
    const phase = this.getPhaseConfig()
    this.stateTimer -= delta

    if (this.bossState === 'idle') {
      this.x += this.glideDirection * 0.95 * (delta / 16)
      if (this.x < GAME_WIDTH * 0.5) this.glideDirection = 1
      if (this.x > GAME_WIDTH - 56) this.glideDirection = -1

      if (time - this.lastAttack > scaleDifficultyCooldown(phase.attackInterval)) {
        const pattern = Phaser.Utils.Array.GetRandom(phase.patterns)
        this.lastAttack = time + this.getPatternRecovery(pattern)
        this.executePattern(pattern, phase.bulletSpeed)
      }

      if (this.stateTimer <= 0) {
        this.bossState = 'gliding'
        this.stateTimer = 620
        this.scene.tweens.add({
          targets: this,
          y: PIANO_Y - 18,
          duration: 200,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            if (!this.active) return
            this.bossState = 'idle'
            this.stateTimer = 900
          },
        })
      }
    }
  }

  private executePattern(pattern: string, speed: number) {
    this.playAttack()
    switch (pattern) {
      case 'key-wave':
        this.keyWave(speed)
        break
      case 'note-fan':
        this.noteFan(speed)
        break
      case 'crescendo-drop':
        this.crescendoDrop(speed)
        break
      case 'grand-recital':
        this.grandRecital(speed)
        break
      case 'bouquet-shot':
        this.bouquetShot(speed)
        break
    }
  }

  private playAttack() {
    this.play('boss-piano-attack', true)
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.active) this.play('boss-piano-idle', true)
    })
  }

  private keyWave(speed: number) {
    const lanes = [-34, 0, 34]
    lanes.forEach((offset, index) => {
      this.scene.time.delayedCall(index * 130, () => {
        if (!this.active) return
        this.bulletPool.fire(
          this.x - 34,
          this.y + offset,
          -speed * 1.1,
          0,
          false,
          1,
          false,
          ENEMY_BULLET_FRAMES.key,
        )
      })
    })
  }

  private noteFan(speed: number) {
    const waveOffsets = [-0.72, 0, 0.72]
    waveOffsets.forEach((offset, index) => {
      this.scene.time.delayedCall(index * 120, () => {
        if (!this.active) return
        const angle = Math.PI + offset
        this.bulletPool.fire(
          this.x - 20,
          this.y - 8,
          Math.cos(angle) * speed * 0.92,
          Math.sin(angle) * speed * 0.92,
          false,
          1,
          false,
          ENEMY_BULLET_FRAMES.note,
        )
      })
    })
  }

  private crescendoDrop(speed: number) {
    for (let index = 0; index < 3; index++) {
      this.scene.time.delayedCall(index * 210, () => {
        if (!this.active) return
        const x = 94 + index * 92
        this.bulletPool.fire(x, -12, 0, speed * 0.9, false, 1, false, ENEMY_BULLET_FRAMES.note)
        if (index === 1) {
          this.bulletPool.fire(x + 20, -18, -28, speed * 0.82, false, 1, false, ENEMY_BULLET_FRAMES.note)
        }
      })
    }
  }

  private grandRecital(speed: number) {
    if (this.bossState === 'recital') return
    this.bossState = 'recital'
    this.scene.tweens.add({
      targets: this,
      x: RECITAL_X,
      y: RECITAL_Y,
      duration: 360,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (!this.active) return
        for (let index = 0; index < 18; index++) {
          this.scene.time.delayedCall(index * 78, () => {
            if (!this.active || this.bossState !== 'recital') return
            const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI)
            const nextSpeed = speed * Phaser.Math.FloatBetween(0.78, 1.08)
            this.bulletPool.fire(
              this.x,
              this.y - 6,
              Math.cos(angle) * nextSpeed,
              Math.sin(angle) * nextSpeed,
              false,
              1,
              false,
              ENEMY_BULLET_FRAMES.note,
            )
          })
        }
        this.scene.time.delayedCall(1540, () => {
          if (!this.active) return
          this.bossState = 'idle'
          this.stateTimer = 900
          this.lastAttack = this.scene.time.now
        })
      },
    })
  }

  private bouquetShot(speed: number) {
    if (this.bossState === 'bouquet') return
    this.bossState = 'bouquet'
    this.damageImmune = true
    const targetX = Phaser.Math.Between(BOUQUET_REPOSITION_MIN_X, BOUQUET_REPOSITION_MAX_X)

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: PIANO_Y,
      duration: BOUQUET_REPOSITION_MS,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (this.body) {
          ;(this.body as Phaser.Physics.Arcade.Body).updateFromGameObject()
        }
      },
      onComplete: () => {
        if (!this.active || this.bossState !== 'bouquet') return
        this.startBouquetCharge(speed)
      },
    })
  }

  private startBouquetCharge(speed: number) {
    this.bouquetChargeVisual?.destroy()
    this.bouquetChargeVisual = this.scene.add
      .sprite(this.x - 30, this.y - 6, 'boss-bouquet')
      .setDepth(9)
      .setAlpha(0.38)
      .setScale(0.42)
      .setBlendMode(Phaser.BlendModes.ADD)

    this.bouquetShieldVisual?.destroy()
    this.bouquetShieldVisual = this.scene.add
      .ellipse(
        this.x + BOUQUET_SHIELD_OFFSET_X,
        this.y + BOUQUET_SHIELD_OFFSET_Y,
        BOUQUET_SHIELD_WIDTH,
        BOUQUET_SHIELD_HEIGHT,
        0x1d6dff,
        0.24,
      )
      .setStrokeStyle(3, 0x39a6ff, 0.98)
      .setDepth(8)

    this.bouquetShieldTween?.destroy()
    this.bouquetShieldTween = this.scene.tweens.add({
      targets: this.bouquetShieldVisual,
      alpha: { from: 0.34, to: 0.8 },
      scale: { from: 0.96, to: 1.03 },
      duration: 120,
      yoyo: true,
      repeat: -1,
    })

    this.scene.tweens.add({
      targets: this.bouquetChargeVisual,
      alpha: { from: 0.38, to: 0.95 },
      scale: { from: 0.42, to: 0.78 },
      duration: BOUQUET_CHARGE_MS,
      ease: 'Sine.easeInOut',
    })

    this.scene.time.delayedCall(BOUQUET_CHARGE_MS, () => {
      if (!this.active || this.bossState !== 'bouquet') return
      this.bouquetChargeVisual?.destroy()
      this.bouquetChargeVisual = null
      this.destroyBouquetShield()
      this.damageImmune = false

      const bouquet = this.bulletPool.fire(this.x - 34, this.y - 6, -speed * 0.72, 0, false, 1)
      bouquet?.configureBossBouquetProjectile()

      this.scene.time.delayedCall(BOUQUET_EXPLODE_MS, () => {
        if (bouquet?.active && bouquet.texture.key === 'boss-bouquet') {
          const burstX = bouquet.x
          const burstY = bouquet.y
          this.explodeBouquet(burstX, burstY, speed, -1)
          if (getDifficultyConfig().pianoBouquetBurstCount > 1) {
            this.scene.time.delayedCall(BOUQUET_SECOND_BURST_DELAY_MS, () => {
              if (this.active) this.explodeBouquet(burstX, burstY, speed, 1)
            })
          }
          bouquet.deactivate()
        }
        if (!this.active) return
        this.bossState = 'idle'
        this.stateTimer = 900
        this.lastAttack = this.scene.time.now + this.getPatternRecovery('bouquet-shot')
      })
    })
  }

  private explodeBouquet(x: number, y: number, speed: number, turnDirection: -1 | 1) {
    this.scene.add
      .particles(x, y, 'particle', {
        speed: { min: 24, max: 68 },
        lifespan: 360,
        quantity: 12,
        scale: { start: 1.4, end: 0 },
        tint: [0xffc7d8, 0xfff0f4, 0xf5a8b8],
        emitting: false,
      })
      .explode(12)

    for (let index = 0; index < BOUQUET_BURST_COUNT; index++) {
      const angle = (Math.PI * 2 * index) / BOUQUET_BURST_COUNT
      const flowerSpeed = speed * BOUQUET_FLOWER_SPEED_RATIO
      const flower = this.bulletPool.fire(
        x,
        y,
        0,
        0,
        false,
        1,
      )
      flower?.configureBossFlowerProjectile(
        BOUQUET_FLOWER_TINTS[index % BOUQUET_FLOWER_TINTS.length],
        x,
        y,
        angle,
        flowerSpeed,
        turnDirection,
      )
    }
  }

  private getPatternRecovery(pattern: string) {
    return scaleDifficultyCooldown(PIANO_PATTERN_RECOVERY[pattern] ?? 0)
  }

  private destroyBouquetShield() {
    this.bouquetShieldTween?.destroy()
    this.bouquetShieldTween = null
    this.bouquetShieldVisual?.destroy()
    this.bouquetShieldVisual = null
  }

  override destroy(fromScene?: boolean) {
    this.hitFlashTween?.destroy()
    this.bouquetChargeVisual?.destroy()
    this.destroyBouquetShield()
    super.destroy(fromScene)
  }
}
