import Phaser from 'phaser'

import { BOSS_CONFIGS } from '../../../content/bosses'
import { scaleDifficultyBossHp, scaleDifficultyCooldown } from '../../../content/difficulty'
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../../constants'
import { BulletPool, ENEMY_BULLET_FRAMES } from '../../systems/BulletPool'
import { getArcadeBodyBounds } from '../../utils/arcadeBounds'

const FLOAT_CENTER_X = GAME_WIDTH - 100
const FLOAT_CENTER_Y = GROUND_Y - 180
const DEFENSE_SHIELD_HEIGHT = 82
const DEFENSE_SHIELD_WIDTH = 128
const DEFENSE_SAFE_WIDTH = 100
const DEFENSE_WARNING_DURATION = 1750
const DEFENSE_MIN_COOLDOWN = 7000
const BOOK_BURST_OFFSETS = [-0.48, 0, 0.48] as const
const ORBIT_SPREAD_OFFSETS = [-0.84, -0.42, 0.42, 0.84] as const

type BossState = 'entering' | 'idle' | 'defense'

export class ThesisBoss extends Phaser.Physics.Arcade.Sprite {
  hp: number
  maxHp: number
  private config = BOSS_CONFIGS.thesis
  private bulletPool: BulletPool
  private lastAttack = 0
  private bossState: BossState = 'entering'
  private floatAngle = 0
  private signatureIndex = 0
  private lastDefenseAt = Number.NEGATIVE_INFINITY
  private hitFlashTween: Phaser.Tweens.Tween | null = null
  private defenseVisuals: Phaser.GameObjects.GameObject[] = []
  private playerRef: Phaser.GameObjects.Sprite
  private onDefenseFail: () => void

  constructor(
    scene: Phaser.Scene,
    bulletPool: BulletPool,
    playerRef: Phaser.GameObjects.Sprite,
    onDefenseFail: () => void,
  ) {
    super(scene, GAME_WIDTH + 30, FLOAT_CENTER_Y, 'boss-thesis')
    this.bulletPool = bulletPool
    this.playerRef = playerRef
    this.onDefenseFail = onDefenseFail
    this.hp = scaleDifficultyBossHp(this.config.hp)
    this.maxHp = this.hp
    scene.add.existing(this)
    scene.physics.add.existing(this)
    ;(this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.setSize(42, 42)
    this.setOffset(3, 3)
    this.setDepth(4)
    this.setScale(1.55)
    this.play('boss-thesis-idle', true)

    scene.tweens.add({
      targets: this,
      x: FLOAT_CENTER_X,
      duration: 1200,
      ease: 'Power2',
      onUpdate: () => {
        if (this.body) {
          ;(this.body as Phaser.Physics.Arcade.Body).updateFromGameObject()
        }
      },
      onComplete: () => {
        if (!this.active) return
        this.setPosition(FLOAT_CENTER_X, FLOAT_CENTER_Y)
        if (this.body) {
          ;(this.body as Phaser.Physics.Arcade.Body).reset(this.x, this.y)
        }
        this.bossState = 'idle'
      },
    })
  }

  takeDamage(amount: number) {
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
    if (this.bossState === 'defense') {
      return new Phaser.Geom.Rectangle(GAME_WIDTH + 200, GAME_HEIGHT + 200, 0, 0)
    }
    const bounds = this.getBounds()
    return new Phaser.Geom.Rectangle(bounds.x + 14, bounds.y + 12, bounds.width - 28, bounds.height - 24)
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
    if (!this.active || this.bossState === 'entering' || this.bossState === 'defense') return
    const phase = this.getPhaseConfig()

    this.floatAngle += delta * 0.0012
    this.x = FLOAT_CENTER_X + Math.sin(this.floatAngle * 0.8) * 52
    this.y = FLOAT_CENTER_Y + Math.sin(this.floatAngle) * 74

    if (time - this.lastAttack > scaleDifficultyCooldown(phase.attackInterval)) {
      this.lastAttack = time
      const pattern = this.selectPattern(phase.patterns, time)
      this.executePattern(pattern, phase.bulletSpeed)
    }
  }

  private selectPattern(patterns: string[], time: number) {
    const signaturePattern = this.signatureIndex < patterns.length ? patterns[this.signatureIndex++] : null
    if (signaturePattern && this.canUsePattern(signaturePattern, time)) return signaturePattern

    const candidates = patterns.filter((pattern) => this.canUsePattern(pattern, time))
    if (candidates.length > 0) return Phaser.Utils.Array.GetRandom(candidates)
    return Phaser.Utils.Array.GetRandom(patterns.filter((pattern) => pattern !== 'doctor-defense')) ?? patterns[0]
  }

  private canUsePattern(pattern: string, time: number) {
    return pattern !== 'doctor-defense' || time - this.lastDefenseAt >= scaleDifficultyCooldown(DEFENSE_MIN_COOLDOWN)
  }

  private executePattern(pattern: string, speed: number) {
    this.playAttack()
    switch (pattern) {
      case 'book-burst':
        this.bookBurst(speed)
        break
      case 'paper-drizzle':
        this.paperDrizzle(speed)
        break
      case 'research-wave':
        this.researchWave(speed)
        break
      case 'orbit-spread':
        this.orbitSpread(speed)
        break
      case 'homing-orbit':
        this.homingOrbit(speed)
        break
      case 'doctor-defense':
        this.doctorDefense()
        break
    }
  }

  private playAttack() {
    this.play('boss-thesis-attack', true)
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.active) this.play('boss-thesis-idle', true)
    })
  }

  private bookBurst(speed: number) {
    BOOK_BURST_OFFSETS.forEach((offset, index) => {
      this.scene.time.delayedCall(index * 80, () => {
        if (!this.active) return
        const angle = Math.PI + offset
        this.bulletPool.fire(
          this.x - 10,
          this.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          false,
          1,
          false,
          ENEMY_BULLET_FRAMES.paper,
        )
      })
    })
  }

  private paperDrizzle(speed: number) {
    for (let index = 0; index < 3; index++) {
      this.scene.time.delayedCall(index * 170, () => {
        if (!this.active) return
        const offsetX = (Math.random() - 0.5) * 190
        const bullet = this.bulletPool.fire(
          this.x + offsetX,
          this.y + 8,
          -24,
          speed * 0.8,
          false,
          1,
          false,
          ENEMY_BULLET_FRAMES.paper,
        )
        if (!bullet) return
        this.scene.time.delayedCall(260, () => {
          if (!bullet.active) return
          bullet.setVelocity(-70 + Math.random() * 140, speed * 0.82)
        })
      })
    }
  }

  private researchWave(speed: number) {
    for (const offset of [-0.28, 0.16]) {
      const angle = Math.PI + offset
      const bullet = this.bulletPool.fire(
        this.x - 12,
        this.y + Phaser.Math.Between(-10, 10),
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * 0.75,
        false,
        1,
        false,
        ENEMY_BULLET_FRAMES.burst,
      )
      if (!bullet) continue

      for (let step = 1; step <= 5; step++) {
        this.scene.time.delayedCall(step * 100, () => {
          if (!bullet.active) return
          bullet.setVelocity(
            Math.cos(angle) * speed + Math.sin(step * 1.2 + offset * 8) * 44,
            Math.sin(angle) * speed * 0.82,
          )
        })
      }
    }
  }

  private orbitSpread(speed: number) {
    for (const offset of ORBIT_SPREAD_OFFSETS) {
      const angle = Math.PI + offset
      this.bulletPool.fire(
        this.x,
        this.y,
        Math.cos(angle) * speed * 0.82,
        Math.sin(angle) * speed * 0.82,
        false,
        1,
        false,
        ENEMY_BULLET_FRAMES.paper,
      )
    }

    this.scene.time.delayedCall(240, () => {
      if (!this.active) return
      this.bulletPool.fire(
        GAME_WIDTH + 10,
        GAME_HEIGHT * 0.36,
        -speed * 1.08,
        30,
        false,
        1,
        false,
        ENEMY_BULLET_FRAMES.paper,
      )
      this.bulletPool.fire(
        GAME_WIDTH + 10,
        GAME_HEIGHT * 0.58,
        -speed * 1.08,
        -25,
        false,
        1,
        false,
        ENEMY_BULLET_FRAMES.paper,
      )
    })
  }

  private homingOrbit(speed: number) {
    for (let index = 0; index < 2; index++) {
      const angle = this.floatAngle + index * Math.PI
      const bullet = this.bulletPool.fire(
        this.x + Math.cos(angle) * 36,
        this.y + Math.sin(angle) * 36,
        0,
        0,
        false,
        1,
        false,
        ENEMY_BULLET_FRAMES.paper,
      )
      if (!bullet) continue
      bullet.configureCapEnemyProjectile(2)
      bullet.configureOrbitHoming(this, this.playerRef, 42, angle, 1350, speed * 0.9, 0.022, 2.7, false, 520)
    }
  }

  private doctorDefense() {
    if (this.bossState === 'defense') return
    this.lastDefenseAt = this.scene.time.now
    this.bossState = 'defense'
    this.setVisible(false)
    const safeX = Phaser.Math.Between(78, GAME_WIDTH - 78)
    const shieldY = Phaser.Math.Between(180, 360)
    const safeTop = shieldY + DEFENSE_SHIELD_HEIGHT / 2
    const safeRect = new Phaser.Geom.Rectangle(
      safeX - DEFENSE_SAFE_WIDTH / 2,
      safeTop,
      DEFENSE_SAFE_WIDTH,
      GROUND_Y - safeTop,
    )
    const warning = this.scene.add
      .text(GAME_WIDTH / 2, 122, 'DEFENSE!', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#78ddff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(65)
      .setStroke('#050716', 4)
    const safeZone = this.scene.add.rectangle(
      safeRect.centerX,
      safeRect.centerY,
      safeRect.width,
      safeRect.height,
      0x78ddff,
      0.12,
    ).setDepth(24)
    const shield = this.scene.add
      .sprite(safeX, shieldY, 'doctor-defense-shield')
      .setDisplaySize(DEFENSE_SHIELD_WIDTH, DEFENSE_SHIELD_HEIGHT)
      .setDepth(64)
    this.defenseVisuals = [warning, safeZone, shield]
    this.scene.tweens.add({
      targets: [warning, safeZone, shield],
      alpha: { from: 0.45, to: 1 },
      duration: 180,
      yoyo: true,
      repeat: 5,
    })

    this.scene.time.delayedCall(DEFENSE_WARNING_DURATION, () => {
      if (!this.active) return
      const playerBounds = getArcadeBodyBounds(this.playerRef)
      const isSafe =
        playerBounds.centerX >= safeRect.left &&
        playerBounds.centerX <= safeRect.right &&
        playerBounds.bottom >= safeRect.top
      this.flashUnsafeZones(safeRect)
      if (!isSafe) {
        this.onDefenseFail()
      }
      this.scene.time.delayedCall(620, () => this.finishDoctorDefense())
    })
  }

  private flashUnsafeZones(safeRect: Phaser.Geom.Rectangle) {
    const overlays = [
      this.scene.add.rectangle(safeRect.left / 2, GAME_HEIGHT / 2, safeRect.left, GAME_HEIGHT, 0x5a0615, 0.96),
      this.scene.add.rectangle(
        safeRect.right + (GAME_WIDTH - safeRect.right) / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH - safeRect.right,
        GAME_HEIGHT,
        0x5a0615,
        0.96,
      ),
      this.scene.add.rectangle(safeRect.centerX, safeRect.top / 2, safeRect.width, safeRect.top, 0x5a0615, 0.96),
      this.scene.add.rectangle(
        safeRect.centerX,
        safeRect.bottom + (GAME_HEIGHT - safeRect.bottom) / 2,
        safeRect.width,
        GAME_HEIGHT - safeRect.bottom,
        0x5a0615,
        0.94,
      ),
    ]
    overlays.forEach((overlay) => overlay.setDepth(70))
    this.scene.tweens.add({
      targets: overlays,
      alpha: 0,
      delay: 180,
      duration: 260,
      onComplete: () => overlays.forEach((overlay) => overlay.destroy()),
    })
  }

  private finishDoctorDefense() {
    if (!this.active) return
    this.defenseVisuals.forEach((visual) => visual.destroy())
    this.defenseVisuals = []
    this.setVisible(true)
    this.bossState = 'idle'
    this.lastAttack = this.scene.time.now
  }

  override destroy(fromScene?: boolean) {
    this.hitFlashTween?.destroy()
    this.defenseVisuals.forEach((visual) => visual.destroy())
    super.destroy(fromScene)
  }
}
