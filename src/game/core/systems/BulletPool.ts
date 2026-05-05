import Phaser from 'phaser'

import { getArcadeBodyBounds } from '../utils/arcadeBounds'

const PLAYER_BULLET_SCALE = 0.36
const CHARGED_BULLET_SCALE = 0.58
const NOTE_BULLET_SCALE = 1.32
const PLAYER_BULLET_HITBOX_RATIO = 0.76
const CHARGED_BULLET_HITBOX_RATIO = 0.58
const ENEMY_BULLET_HITBOX_RATIO = 0.68
const PLAYER_BULLET_MIN_VISIBLE_MS = 50
const PLAYER_NOTE_BULLET_FRAME_COUNT = 5
const PLAYER_CHARGED_BULLET_FRAME_COUNT = 5
const PLAYER_NOTE_WOBBLE_DEGREES = 12
const PLAYER_NOTE_WOBBLE_PERIOD_MS = 520
const BOSS_BOUQUET_DISPLAY_SIZE = 42
const BOSS_BOUQUET_HITBOX_RATIO = 0.62
const BOSS_FLOWER_DISPLAY_SIZE = 22
const BOSS_FLOWER_HITBOX_RATIO = 0.68
const BOSS_FLOWER_ANGULAR_VELOCITY = 540
const BOSS_FLOWER_SPIRAL_TANGENTIAL_RATIO = 0.75
const BOSS_FLOWER_SPIRAL_MIN_RADIUS = 20
const BOSS_FLOWER_SPIRAL_RADIAL_ACCELERATION = 22
const BOSS_FLOWER_SPIRAL_MAX_RADIAL_SPEED_RATIO = 1.22
const BOSS_FLOWER_FADE_START_RADIUS = 150
const BOSS_FLOWER_FADE_END_RADIUS = 210

interface OrbitHomingState {
  origin: Phaser.GameObjects.Sprite
  target: Phaser.GameObjects.Sprite
  activateAt: number
  orbitRadius: number
  orbitAngle: number
  orbitSpeed: number
  speed: number
  turnRate: number
  currentAngle: number | null
  rotateToVelocity: boolean
  steerUntil: number
}

interface SpiralState {
  originX: number
  originY: number
  angle: number
  turnDirection: -1 | 1
  radius: number
  radialSpeed: number
  maxRadialSpeed: number
  radialAcceleration: number
  tangentialSpeed: number
}

export const ENEMY_BULLET_FRAMES = {
  orb: 0,
  burst: 2,
  paper: 4,
  note: 6,
  key: 8,
  steam: 10,
  cargo: 12,
  beam: 14,
} as const

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  isPlayerBullet = false
  damage = 1
  isChargedBullet = false
  isBeamHazard = false
  isDestructibleEnemyBullet = false
  private beamLine: Phaser.Geom.Line | null = null
  private beamHalfWidth = 0
  private beamVisuals: Phaser.GameObjects.GameObject[] = []
  private destructibleHp = 0
  private orbitHomingState: OrbitHomingState | null = null
  private spiralState: SpiralState | null = null
  private canDamageAt = 0
  private noteWobblePhase: number | null = null

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy-bullets', 0)
  }

  fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    isPlayer: boolean,
    damage = 1,
    charged = false,
    enemyFrame: number = ENEMY_BULLET_FRAMES.orb,
    playerFrame = 0,
  ) {
    this.setPosition(x, y)
    this.setActive(true)
    this.setVisible(true)
    this.isPlayerBullet = isPlayer
    this.isChargedBullet = charged
    this.isBeamHazard = false
    this.isDestructibleEnemyBullet = false
    this.beamLine = null
    this.beamHalfWidth = 0
    this.destructibleHp = 0
    this.orbitHomingState = null
    this.spiralState = null
    this.noteWobblePhase = null
    this.destroyBeamVisuals()
    this.damage = damage
    this.canDamageAt = isPlayer ? this.scene.time.now + PLAYER_BULLET_MIN_VISIBLE_MS : 0
    this.setDepth(isPlayer ? 7 : 8)
    if (isPlayer) {
      this.clearTint()
      if (charged) {
        this.setTexture(
          'charged-bullet',
          Phaser.Math.Clamp(playerFrame, 0, PLAYER_CHARGED_BULLET_FRAME_COUNT - 1),
        )
      } else {
        this.setTexture('basic-bullet', Phaser.Math.Between(0, PLAYER_NOTE_BULLET_FRAME_COUNT - 1))
      }
      this.stop()
    } else {
      this.setTexture('enemy-bullets', enemyFrame)
      this.play(`enemy-bullet-${enemyFrame}`, true)
    }
    this.setDisplaySize(this.frame.realWidth, this.frame.realHeight)
    this.setScale(isPlayer ? (charged ? CHARGED_BULLET_SCALE : PLAYER_BULLET_SCALE) : this.getEnemyBulletScale(enemyFrame))
    const isPlayerNoteBullet = isPlayer && !charged
    if (isPlayerNoteBullet) {
      this.noteWobblePhase = Phaser.Math.FloatBetween(0, Math.PI * 2)
    }
    const isSpinningEnemyBullet = !isPlayer && enemyFrame === ENEMY_BULLET_FRAMES.burst
    let initialAngle = 0
    if (isSpinningEnemyBullet) {
      initialAngle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(0, 0, vx, vy))
    }
    this.setAngle(initialAngle)
    if (!isPlayer || charged) {
      this.clearTint()
    }
    this.clearFX()
    this.setAlpha(1)
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body
      body.enable = true
      body.setAllowGravity(false)
      if (isPlayer) {
        const hitboxRatio = charged ? CHARGED_BULLET_HITBOX_RATIO : PLAYER_BULLET_HITBOX_RATIO
        body.setSize(
          Math.max(8, this.frame.realWidth * hitboxRatio),
          Math.max(8, this.frame.realHeight * hitboxRatio),
          true,
        )
      } else {
        body.setSize(
          Math.max(6, this.displayWidth * ENEMY_BULLET_HITBOX_RATIO),
          Math.max(6, this.displayHeight * ENEMY_BULLET_HITBOX_RATIO),
          true,
        )
      }
      this.setVelocity(vx, vy)
      body.setAngularVelocity(isSpinningEnemyBullet ? 360 : 0)
    }
  }

  configureDestructibleEnemyBullet(hp: number) {
    this.isDestructibleEnemyBullet = true
    this.destructibleHp = hp
    this.setTint(0xf6d7b0)
  }

  configureCapEnemyProjectile(hp: number) {
    this.configureDestructibleEnemyBullet(hp)
    this.setTexture('enemies', 16)
    this.play('enemy-cap-idle', true)
    this.clearTint()
    this.setDisplaySize(30, 30)
    this.setAngle(0)
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setSize(18, 18, true)
      body.setAngularVelocity(0)
    }
  }

  configureBossBouquetProjectile() {
    this.configureCustomEnemyProjectile('boss-bouquet', BOSS_BOUQUET_DISPLAY_SIZE, BOSS_BOUQUET_HITBOX_RATIO, -120)
  }

  configureBossFlowerProjectile(
    tint: number | undefined,
    originX: number,
    originY: number,
    angle: number,
    speed: number,
    turnDirection: -1 | 1 = -1,
  ) {
    this.setPosition(originX, originY)
    this.configureCustomEnemyProjectile(
      'boss-flower-bullet',
      BOSS_FLOWER_DISPLAY_SIZE,
      BOSS_FLOWER_HITBOX_RATIO,
      BOSS_FLOWER_ANGULAR_VELOCITY,
      tint,
    )
    this.spiralState = {
      originX,
      originY,
      angle,
      turnDirection,
      radius: 0,
      radialSpeed: speed,
      maxRadialSpeed: speed * BOSS_FLOWER_SPIRAL_MAX_RADIAL_SPEED_RATIO,
      radialAcceleration: BOSS_FLOWER_SPIRAL_RADIAL_ACCELERATION,
      tangentialSpeed: speed * BOSS_FLOWER_SPIRAL_TANGENTIAL_RATIO,
    }
    this.setVelocity(0, 0)
  }

  private configureCustomEnemyProjectile(
    textureKey: string,
    displaySize: number,
    hitboxRatio: number,
    angularVelocity: number,
    tint?: number,
  ) {
    this.setTexture(textureKey)
    this.stop()
    if (tint === undefined) {
      this.clearTint()
    } else {
      this.setTint(tint)
    }
    this.setDisplaySize(displaySize, displaySize)
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body
      this.setAngle(Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(0, 0, body.velocity.x, body.velocity.y)))
      body.setSize(Math.max(6, displaySize * hitboxRatio), Math.max(6, displaySize * hitboxRatio), true)
      body.setAngularVelocity(angularVelocity)
    }
  }

  configureOrbitHoming(
    origin: Phaser.GameObjects.Sprite,
    target: Phaser.GameObjects.Sprite,
    orbitRadius: number,
    orbitAngle: number,
    orbitDuration: number,
    speed: number,
    turnRate: number,
    orbitSpeed: number,
    rotateToVelocity = true,
    steeringDuration = Number.POSITIVE_INFINITY,
  ) {
    this.orbitHomingState = {
      origin,
      target,
      activateAt: this.scene.time.now + orbitDuration,
      orbitRadius,
      orbitAngle,
      orbitSpeed,
      speed,
      turnRate,
      currentAngle: null,
      rotateToVelocity,
      steerUntil: this.scene.time.now + steeringDuration,
    }
    this.setVelocity(0, 0)
  }

  damageDestructible(amount: number) {
    if (!this.isDestructibleEnemyBullet) return false
    this.destructibleHp -= amount
    this.setAlpha(0.55)
    this.scene.time.delayedCall(45, () => {
      if (this.active && this.isDestructibleEnemyBullet) this.setAlpha(1)
    })
    return this.destructibleHp <= 0
  }

  canDamageTarget(time = this.scene.time.now) {
    return !this.isPlayerBullet || time >= this.canDamageAt
  }

  configureHazard(width: number, height: number, angle: number, alpha = 0.8, tint = 0xfff4cf) {
    const halfLength = width / 2
    this.configureHazardFromSegment(
      this.x - Math.cos(angle) * halfLength,
      this.y - Math.sin(angle) * halfLength,
      this.x + Math.cos(angle) * halfLength,
      this.y + Math.sin(angle) * halfLength,
      height,
      alpha,
      tint,
    )
  }

  configureHazardFromSegment(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    height: number,
    alpha = 0.8,
    tint = 0xfff4cf,
  ) {
    const width = Phaser.Math.Distance.Between(startX, startY, endX, endY)
    const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY)
    const centerX = (startX + endX) / 2
    const centerY = (startY + endY) / 2
    this.setPosition(centerX, centerY)
    this.setDisplaySize(width, height)
    this.setAngle(Phaser.Math.RadToDeg(angle))
    this.setAlpha(alpha)
    this.setTint(tint)
    this.setVisible(false)
    this.isBeamHazard = true
    this.beamHalfWidth = height / 2
    this.beamLine = new Phaser.Geom.Line(startX, startY, endX, endY)
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body
      body.enable = false
      body.setVelocity(0, 0)
      body.setAngularVelocity(0)
    }

    this.destroyBeamVisuals()
    const glow = this.scene.add
      .rectangle(centerX, centerY, width, height * 2.1, 0xffb000, 0.28)
      .setRotation(angle)
      .setDepth(21)
      .setBlendMode(Phaser.BlendModes.ADD)
    const core = this.scene.add
      .rectangle(centerX, centerY, width, Math.max(5, height * 0.42), 0xfff36a, 0.96)
      .setRotation(angle)
      .setDepth(22)
      .setBlendMode(Phaser.BlendModes.ADD)
    const lensFlash = this.scene.add
      .circle(startX, startY, height * 0.75, 0xfff5a6, 0.85)
      .setDepth(23)
      .setBlendMode(Phaser.BlendModes.ADD)
    this.beamVisuals = [glow, core, lensFlash]
  }

  intersectsBeamTarget(target: Phaser.GameObjects.Components.GetBounds) {
    if (!this.active || !this.isBeamHazard || !this.beamLine) return false
    return this.intersectsBeamBounds(getArcadeBodyBounds(target))
  }

  intersectsBeamBounds(bounds: Phaser.Geom.Rectangle) {
    if (!this.active || !this.isBeamHazard || !this.beamLine) return false
    const points = [
      new Phaser.Geom.Point(bounds.centerX, bounds.centerY),
      new Phaser.Geom.Point(bounds.left, bounds.top),
      new Phaser.Geom.Point(bounds.right, bounds.top),
      new Phaser.Geom.Point(bounds.left, bounds.bottom),
      new Phaser.Geom.Point(bounds.right, bounds.bottom),
    ]

    return points.some((point) => this.distanceToBeamSegment(point.x, point.y) <= this.beamHalfWidth)
  }

  getHitBounds() {
    return getArcadeBodyBounds(this)
  }

  getDebugBeamSegment() {
    if (!this.active || !this.isBeamHazard || !this.beamLine) return null
    return {
      line: this.beamLine,
      width: this.beamHalfWidth * 2,
    }
  }

  private distanceToBeamSegment(x: number, y: number) {
    if (!this.beamLine) return Number.POSITIVE_INFINITY
    const x1 = this.beamLine.x1
    const y1 = this.beamLine.y1
    const dx = this.beamLine.x2 - x1
    const dy = this.beamLine.y2 - y1
    const lengthSq = dx * dx + dy * dy
    if (lengthSq === 0) return Phaser.Math.Distance.Between(x, y, x1, y1)
    const t = Phaser.Math.Clamp(((x - x1) * dx + (y - y1) * dy) / lengthSq, 0, 1)
    return Phaser.Math.Distance.Between(x, y, x1 + t * dx, y1 + t * dy)
  }

  deactivate() {
    this.setActive(false)
    this.setVisible(false)
    this.stop()
    this.destroyBeamVisuals()
    this.clearFX()
    this.clearTint()
    this.setAlpha(1)
    this.setAngle(0)
    this.isBeamHazard = false
    this.isDestructibleEnemyBullet = false
    this.beamLine = null
    this.beamHalfWidth = 0
    this.destructibleHp = 0
    this.orbitHomingState = null
    this.spiralState = null
    this.noteWobblePhase = null
    this.canDamageAt = 0
    if (this.body) {
      this.setVelocity(0, 0)
      this.setAngularVelocity(0)
      ;(this.body as Phaser.Physics.Arcade.Body).enable = false
    }
  }

  private destroyBeamVisuals() {
    this.beamVisuals.forEach((visual) => visual.destroy())
    this.beamVisuals = []
  }

  override preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta)
    if (!this.active) return
    if (this.isBeamHazard) return
    this.updateNoteWobble(time)
    this.updateOrbitHoming(time, delta)
    this.updateSpiral(delta)
    if (this.x < -20 || this.x > 460 || this.y < -20 || this.y > 740) {
      this.deactivate()
    }
  }

  private updateSpiral(delta: number) {
    const state = this.spiralState
    if (!state) return

    const deltaSeconds = delta / 1000
    state.radialSpeed = Math.min(state.maxRadialSpeed, state.radialSpeed + state.radialAcceleration * deltaSeconds)
    state.radius += state.radialSpeed * deltaSeconds
    const effectiveRadius = Math.max(state.radius, BOSS_FLOWER_SPIRAL_MIN_RADIUS)
    state.angle += state.turnDirection * (state.tangentialSpeed / effectiveRadius) * deltaSeconds
    if (state.radius >= BOSS_FLOWER_FADE_START_RADIUS) {
      const fadeProgress = Phaser.Math.Clamp(
        (state.radius - BOSS_FLOWER_FADE_START_RADIUS) / (BOSS_FLOWER_FADE_END_RADIUS - BOSS_FLOWER_FADE_START_RADIUS),
        0,
        1,
      )
      this.setAlpha(1 - fadeProgress)
      if (fadeProgress >= 1) {
        this.deactivate()
        return
      }
    }
    this.setPosition(
      state.originX + Math.cos(state.angle) * state.radius,
      state.originY + Math.sin(state.angle) * state.radius,
    )
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body
      body.reset(this.x, this.y)
      body.setAllowGravity(false)
      body.setAngularVelocity(BOSS_FLOWER_ANGULAR_VELOCITY)
    }
  }

  private updateOrbitHoming(time: number, delta: number) {
    const state = this.orbitHomingState
    if (!state) return

    const body = this.body as Phaser.Physics.Arcade.Body | null
    if (time < state.activateAt && state.origin.active) {
      state.orbitAngle += state.orbitSpeed * (delta / 1000)
      this.setPosition(
        state.origin.x + Math.cos(state.orbitAngle) * state.orbitRadius,
        state.origin.y + Math.sin(state.orbitAngle) * state.orbitRadius,
      )
      body?.setVelocity(0, 0)
      if (!state.rotateToVelocity) this.setAngle(0)
      return
    }

    const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, state.target.x, state.target.y)
    if (state.currentAngle === null) {
      state.currentAngle = targetAngle
    } else if (time <= state.steerUntil) {
      state.currentAngle = Phaser.Math.Angle.RotateTo(state.currentAngle, targetAngle, state.turnRate)
    }
    body?.setVelocity(Math.cos(state.currentAngle) * state.speed, Math.sin(state.currentAngle) * state.speed)
    this.setAngle(state.rotateToVelocity ? Phaser.Math.RadToDeg(state.currentAngle) : 0)
  }

  private updateNoteWobble(time: number) {
    if (this.noteWobblePhase === null) return
    const progress = (time / PLAYER_NOTE_WOBBLE_PERIOD_MS) * Math.PI * 2
    this.setAngle(Math.sin(progress + this.noteWobblePhase) * PLAYER_NOTE_WOBBLE_DEGREES)
  }

  private getEnemyBulletScale(enemyFrame: number) {
    return enemyFrame === ENEMY_BULLET_FRAMES.note ? NOTE_BULLET_SCALE : 1
  }
}

export class BulletPool {
  private pool: Phaser.Physics.Arcade.Group

  constructor(scene: Phaser.Scene, size = 100) {
    this.pool = scene.physics.add.group({
      classType: Bullet,
      maxSize: size,
      runChildUpdate: true,
    })

    for (let index = 0; index < size; index++) {
      const bullet = new Bullet(scene, -50, -50)
      this.pool.add(bullet, true)
      bullet.deactivate()
    }
  }

  fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    isPlayer: boolean,
    damage = 1,
    charged = false,
    enemyFrame: number = ENEMY_BULLET_FRAMES.orb,
    playerFrame = 0,
  ) {
    const bullet = this.pool.getFirstDead(false) as Bullet | null
    if (bullet) {
      bullet.fire(x, y, vx, vy, isPlayer, damage, charged, enemyFrame, playerFrame)
    }
    return bullet
  }

  getGroup() {
    return this.pool
  }

  deactivateAll() {
    this.pool.getChildren().forEach((child) => (child as Bullet).deactivate())
  }
}
