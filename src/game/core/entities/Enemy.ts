import Phaser from 'phaser'

import { type EnemyConfig } from '../../content/enemies'
import { type SpawnEvent } from '../../content/stages'
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../constants'
import { BulletPool, ENEMY_BULLET_FRAMES } from '../systems/BulletPool'

type EnemyPhase = 'enter' | 'attack' | 'exit'

const FALLBACK_X = GAME_WIDTH * 0.15
const FALLBACK_Y = GROUND_Y - 48
const CAMERA_LENS_OFFSET_X = 0
const CAMERA_LENS_OFFSET_Y = 0
const CAMERA_MIN_VISIBLE_X = GAME_WIDTH - 34
const CAMERA_BEAM_LOCK_DURATION = 2050
const KAMIKAZE_TRIGGER_X_DISTANCE = 230
const KAMIKAZE_TRIGGER_X = GAME_WIDTH * 0.56
const KAMIKAZE_CHASE_TURN_RATE = 0.075

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number
  config: EnemyConfig
  private bulletPool: BulletPool | null = null
  private playerRef: Phaser.GameObjects.Sprite | null = null
  private phase: EnemyPhase = 'enter'
  private shotsFired = 0
  private lastShot = 0
  private attackTimer = 0
  private attackX: number
  private attackY: number
  private spawnMeta: SpawnEvent | null = null
  private beamLockUntil = 0
  private beamLockX = 0
  private beamLockY = 0
  private hitFlashTween: Phaser.Tweens.Tween | null = null

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    super(scene, x, y, 'enemies', config.frame * 4)
    this.config = config
    this.hp = config.hp
    scene.add.existing(this)
    scene.physics.add.existing(this)
    ;(this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.setSize(24, 24)
    this.setOffset(4, 4)
    this.setDepth(4)
    this.play(`enemy-${config.type}-idle`, true)

    switch (config.moveStyle) {
      case 'swoop':
        this.attackX = GAME_WIDTH * 0.55 + Math.random() * 60
        this.attackY = FALLBACK_Y - 50 - Math.random() * 30
        break
      case 'dive':
        this.attackX = GAME_WIDTH * 0.46 + Math.random() * 55
        this.attackY = FALLBACK_Y - 30 - Math.random() * 20
        break
      case 'hover':
        this.attackX = GAME_WIDTH * 0.66 + Math.random() * 50
        this.attackY = FALLBACK_Y - 100 - Math.random() * 60
        break
      case 'kamikaze':
        this.attackX = GAME_WIDTH * 0.66
        this.attackY = y
        break
      case 'strafe':
      default:
        this.attackX = -50
        this.attackY = y
        this.phase = 'attack'
        this.attackTimer = config.attackDuration
        break
    }
  }

  setBulletPool(pool: BulletPool) {
    this.bulletPool = pool
  }

  setPlayerRef(player: Phaser.GameObjects.Sprite) {
    this.playerRef = player
  }

  setSpawnMeta(spawn: SpawnEvent) {
    this.spawnMeta = spawn
  }

  getSpawnMeta() {
    return this.spawnMeta
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
      alpha: { from: 1, to: 0.38 },
      duration: 45,
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

  update(time: number, delta: number) {
    if (!this.active) return
    const body = this.body as Phaser.Physics.Arcade.Body

    const isCameraBeamLocked = this.isCameraBeamLocked(time)
    if (isCameraBeamLocked) {
      this.lockBeamBody(body)
      if (this.phase !== 'attack') return
    }

    switch (this.phase) {
      case 'enter':
        this.updateEnter(body)
        break
      case 'attack':
        this.updateAttack(body, time, delta)
        break
      case 'exit':
        this.updateExit(body)
        break
    }

    if (this.x < -60 || this.x > GAME_WIDTH + 80 || this.y > GAME_HEIGHT + 60 || this.y < -60) {
      this.destroy()
    }
  }

  private updateEnter(body: Phaser.Physics.Arcade.Body) {
    switch (this.config.moveStyle) {
      case 'swoop':
        body.setVelocityX(-this.config.speed)
        body.setVelocityY((this.attackY - this.y) * 2.5)
        break
      case 'dive':
        body.setVelocityX(-this.config.speed * 1.3)
        body.setVelocityY(Math.max(0, this.attackY - this.y) * 3)
        break
      case 'hover': {
        const dist = Math.max(30, this.x - this.attackX)
        const decel = Math.min(1, dist / 200)
        body.setVelocityX(-this.config.speed * decel)
        body.setVelocityY((this.attackY - this.y) * 2)
        break
      }
      case 'kamikaze': {
        const tx = this.playerRef?.x ?? FALLBACK_X
        body.setVelocityX(-this.config.speed * 0.55)
        body.setVelocityY((this.attackY - this.y) * 1.6)
        if (Math.abs(this.x - tx) <= KAMIKAZE_TRIGGER_X_DISTANCE || this.x <= KAMIKAZE_TRIGGER_X) {
          this.phase = 'attack'
          this.attackTimer = this.config.attackDuration
        }
        break
      }
    }

    if (this.config.moveStyle !== 'kamikaze' && this.x <= this.attackX + 10) {
      this.phase = 'attack'
      this.attackTimer = this.config.attackDuration
      this.lastShot = this.scene.time.now - this.config.shotInterval + 220
      body.setVelocity(0, 0)
    }
  }

  private updateAttack(body: Phaser.Physics.Arcade.Body, time: number, delta: number) {
    this.attackTimer -= delta
    const bulletPattern = this.spawnMeta?.patternOverride ?? this.config.bulletPattern
    const shotCount = this.getShotCount()
    const isBeamLocked = time < this.beamLockUntil
    const isWaitingForNextBeam =
      bulletPattern === 'telegraph-beam' && this.shotsFired > 0 && this.shotsFired < shotCount

    if (this.config.moveStyle === 'kamikaze') {
      const tx = this.playerRef?.x ?? FALLBACK_X
      const ty = this.playerRef?.y ?? FALLBACK_Y
      const currentAngle = Math.atan2(body.velocity.y, body.velocity.x)
      const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty)
      const nextAngle = Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, KAMIKAZE_CHASE_TURN_RATE)
      const chaseSpeed = this.config.speed * 2.55
      body.setVelocity(Math.cos(nextAngle) * chaseSpeed, Math.sin(nextAngle) * chaseSpeed)
    } else if (isBeamLocked || isWaitingForNextBeam) {
      this.lockBeamBody(body)
    } else if (this.config.moveStyle === 'strafe') {
      body.setVelocityX(-this.config.speed * 0.6)
      body.setVelocityY(0)
    } else {
      body.setVelocityX(0)
      body.setVelocityY(Math.sin(time * 0.004) * 15)
    }

    if (this.shotsFired < shotCount && time - this.lastShot > this.config.shotInterval) {
      const canShoot =
        bulletPattern !== 'telegraph-beam' || (this.x <= CAMERA_MIN_VISIBLE_X && time >= this.beamLockUntil)
      if (canShoot) {
        this.lastShot = time
        this.shotsFired++
        this.shootAtPlayer()
      }
    }

    if (this.shotsFired >= shotCount && this.attackTimer <= 0 && !this.isCameraBeamLocked(time)) {
      this.phase = 'exit'
    }
  }

  private getShotCount() {
    return this.spawnMeta?.shotCountOverride ?? this.config.shotCount
  }

  private isCameraBeamLocked(time: number) {
    const bulletPattern = this.spawnMeta?.patternOverride ?? this.config.bulletPattern
    return bulletPattern === 'telegraph-beam' && time < this.beamLockUntil
  }

  private updateExit(body: Phaser.Physics.Arcade.Body) {
    switch (this.config.moveStyle) {
      case 'swoop':
        body.setVelocityX(-this.config.speed * 1.5)
        body.setVelocityY(-this.config.speed)
        break
      case 'dive':
        body.setVelocityX(this.config.speed * 1.5)
        body.setVelocityY(-this.config.speed * 0.8)
        break
      case 'hover':
        body.setVelocityX(this.config.speed * 1.3)
        body.setVelocityY(-this.config.speed * 0.3)
        break
      case 'strafe':
        body.setVelocityX(-this.config.speed * 1.5)
        body.setVelocityY(0)
        break
      case 'kamikaze':
        body.setVelocityX(-this.config.speed * 1.8)
        body.setVelocityY(this.config.speed * 0.2)
        break
    }
  }

  private shootAtPlayer() {
    if (!this.bulletPool) return
    const tx = this.playerRef?.x ?? FALLBACK_X
    const ty = this.playerRef?.y ?? FALLBACK_Y
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty)
    const speed = this.config.bulletSpeed

    const bulletPattern = this.spawnMeta?.patternOverride ?? this.config.bulletPattern

    switch (bulletPattern) {
      case 'aimed':
        this.bulletPool.fire(
          this.x,
          this.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          false,
          1,
          false,
          ENEMY_BULLET_FRAMES.orb,
        )
        break
      case 'aimed-spread':
        for (const offset of [-0.2, 0, 0.2]) {
          const nextAngle = angle + offset
          this.bulletPool.fire(
            this.x,
            this.y,
            Math.cos(nextAngle) * speed,
            Math.sin(nextAngle) * speed,
            false,
            1,
            false,
            ENEMY_BULLET_FRAMES.burst,
          )
        }
        break
      case 'aimed-burst':
        for (let index = 0; index < 2; index++) {
          this.scene.time.delayedCall(index * 95, () => {
            if (!this.active || !this.bulletPool) return
            const px = this.playerRef?.x ?? FALLBACK_X
            const py = this.playerRef?.y ?? FALLBACK_Y
            const nextAngle = Phaser.Math.Angle.Between(this.x, this.y, px, py)
            this.bulletPool.fire(
              this.x,
              this.y,
              Math.cos(nextAngle) * speed,
              Math.sin(nextAngle) * speed,
              false,
              1,
              false,
              ENEMY_BULLET_FRAMES.burst,
            )
          })
        }
        break
      case 'rain':
        for (let index = 0; index < 3; index++) {
          const ox = (index - 1) * 30
          const nextAngle = Phaser.Math.Angle.Between(this.x + ox, this.y, tx, ty)
          this.bulletPool.fire(
            this.x + ox,
            this.y,
            Math.cos(nextAngle) * speed * 0.5,
            Math.sin(nextAngle) * speed,
            false,
            1,
            false,
            ENEMY_BULLET_FRAMES.paper,
          )
        }
        break
      case 'telegraph-beam':
        this.telegraphBeam(tx, ty)
        break
      case 'wobble':
        this.wobbleShot(angle, speed)
        break
      case 'curved-fan':
        this.curvedFan(speed)
        break
      case 'paper-semicircle':
        this.paperSemicircle(speed)
        break
    }
  }

  private telegraphBeam(targetX: number, targetY: number) {
    if (!this.bulletPool) return
    const scene = this.scene
    this.beamLockUntil = this.scene.time.now + CAMERA_BEAM_LOCK_DURATION
    this.beamLockX = this.x
    this.beamLockY = this.y
    const body = this.body as Phaser.Physics.Arcade.Body | null
    if (body) {
      this.lockBeamBody(body)
    }
    const sourceX = this.x + CAMERA_LENS_OFFSET_X
    const sourceY = this.y + CAMERA_LENS_OFFSET_Y
    const beamAngle = Phaser.Math.Angle.Between(sourceX, sourceY, targetX, targetY)
    const beamLength = GAME_WIDTH * 1.65
    const beamEndX = sourceX + Math.cos(beamAngle) * beamLength
    const beamEndY = sourceY + Math.sin(beamAngle) * beamLength
    const beamCenterX = (sourceX + beamEndX) / 2
    const beamCenterY = (sourceY + beamEndY) / 2
    const telegraph = this.scene.add
      .rectangle(beamCenterX, beamCenterY, beamLength, 10, 0xffd34a, 0.22)
      .setRotation(beamAngle)
      .setDepth(20)
      .setBlendMode(Phaser.BlendModes.ADD)
    const lensDot = this.scene.add
      .circle(sourceX, sourceY, 5, 0xfff0a0, 0.5)
      .setDepth(21)
      .setBlendMode(Phaser.BlendModes.ADD)

    this.scene.tweens.add({
      targets: [telegraph, lensDot],
      alpha: { from: 0.16, to: 0.62 },
      duration: 240,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        telegraph.destroy()
        lensDot.destroy()
      },
    })

    scene.time.delayedCall(1500, () => {
      if (!this.active || !this.bulletPool) return
      const hazard = this.bulletPool.fire(
        beamCenterX,
        beamCenterY,
        0,
        0,
        false,
        1,
        false,
        ENEMY_BULLET_FRAMES.beam,
      )
      if (!hazard) return
      hazard.configureHazardFromSegment(sourceX, sourceY, beamEndX, beamEndY, 11, 1, 0xfff36a)

      scene.time.delayedCall(240, () => {
        if (hazard.active) {
          hazard.deactivate()
        }
      })
    })
  }

  private wobbleShot(angle: number, speed: number) {
    if (!this.bulletPool) return
    for (const offset of [-0.12, 0.12]) {
      const nextAngle = angle + offset
      const bullet = this.bulletPool.fire(
        this.x,
        this.y,
        Math.cos(nextAngle) * speed,
        Math.sin(nextAngle) * speed,
        false,
        1,
        false,
        ENEMY_BULLET_FRAMES.burst,
      )

      if (!bullet) continue

      for (let step = 1; step <= 4; step++) {
        this.scene.time.delayedCall(step * 120, () => {
          if (!bullet.active) return
          const curve = Math.sin(step * 0.9) * 42 * (offset < 0 ? -1 : 1)
          bullet.setVelocity(Math.cos(nextAngle) * speed + curve, Math.sin(nextAngle) * speed)
        })
      }
    }
  }

  private lockBeamBody(body: Phaser.Physics.Arcade.Body) {
    this.setPosition(this.beamLockX, this.beamLockY)
    body.reset(this.beamLockX, this.beamLockY)
    body.setVelocity(0, 0)
    body.velocity.set(0, 0)
  }

  private curvedFan(speed: number) {
    if (!this.bulletPool) return
    for (const offset of [-0.22, 0, 0.22]) {
      const nextAngle = Math.PI + offset
      const bullet = this.bulletPool.fire(
        this.x,
        this.y,
        Math.cos(nextAngle) * speed,
        Math.sin(nextAngle) * speed * 0.45,
        false,
        1,
        false,
        ENEMY_BULLET_FRAMES.paper,
      )

      if (!bullet) continue

      this.scene.time.delayedCall(220, () => {
        if (!bullet.active) return
        bullet.setVelocity(Math.cos(nextAngle) * speed * 0.88, Math.sin(nextAngle) * speed * 0.9)
      })
    }
  }

  private paperSemicircle(speed: number) {
    if (!this.bulletPool) return
    for (let index = 0; index < 3; index++) {
      const angle = Math.PI - 0.46 + index * 0.46
      const bullet = this.bulletPool.fire(
        this.x - 4,
        this.y,
        Math.cos(angle) * speed * 0.86,
        Math.sin(angle) * speed * 0.58,
        false,
        1,
        false,
        ENEMY_BULLET_FRAMES.paper,
      )

      if (!bullet) continue

      this.scene.time.delayedCall(180, () => {
        if (!bullet.active) return
        bullet.setVelocity(Math.cos(angle) * speed * 0.78, Math.sin(angle) * speed * 0.82)
      })
    }
  }

  override destroy(fromScene?: boolean) {
    this.hitFlashTween?.destroy()
    this.bulletPool = null
    this.playerRef = null
    super.destroy(fromScene)
  }
}
