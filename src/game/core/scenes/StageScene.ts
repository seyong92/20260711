import Phaser from 'phaser'

import { ITEM_CONFIGS } from '../../content/items'
import { getStageConfig } from '../../content/stages'
import { Enemy } from '../entities/Enemy'
import { Item } from '../entities/Item'
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../constants'
import { MOBILE_RANGED_AUTOFIRE_ENABLED, Player } from '../entities/Player'
import { Bullet, BulletPool } from '../systems/BulletPool'
import { EnemySpawner } from '../systems/EnemySpawner'
import { HitboxDebugOverlay } from '../systems/HitboxDebugOverlay'
import { getSelectedDifficultyId } from '../../content/difficulty'
import { getSelectedPlayerCharacter } from '../systems/PlayerSelection'
import { progressStorage } from '../systems/ProgressStorage'
import { runState } from '../systems/RunState'
import { scoreManager } from '../systems/ScoreManager'
import { ScrollManager } from '../systems/ScrollManager'
import { HUD } from '../ui/HUD'
import { PauseMenu } from '../ui/PauseMenu'
import { TouchControls } from '../ui/TouchControls'
import { getArcadeBodyBounds } from '../utils/arcadeBounds'
import type { BossCarryState, ItemCarryState } from './sceneCarry'

const DROPPED_POWERUP_PICKUP_DELAY = 650
const DROPPED_POWERUP_SPEED = 140
const ITEM_OVERFLOW_SCORE = 500

const STAGE_TEXT_THEMES = {
  dark: {
    accent: '#ffd700',
    body: '#e0e0e0',
    stroke: '#050716',
  },
  light: {
    accent: '#9f2f5f',
    body: '#2f2333',
    stroke: '#fff3e2',
  },
} as const

export class StageScene extends Phaser.Scene {
  private player!: Player
  private bulletPool!: BulletPool
  private scrollManager!: ScrollManager
  private enemySpawner!: EnemySpawner
  private debugOverlay!: HitboxDebugOverlay
  private hud!: HUD
  private pauseMenu!: PauseMenu
  private controls!: TouchControls
  private droppedPowerups!: Phaser.Physics.Arcade.Group
  private stageIndex = 0
  private stageStartTime = 0
  private stageComplete = false
  private inputLocked = false

  constructor() {
    super({ key: 'StageScene' })
  }

  init(data: { stageIndex: number }) {
    this.stageIndex = data.stageIndex ?? 0
    this.stageComplete = false
    this.inputLocked = false
  }

  create() {
    const stage = getStageConfig(this.stageIndex)
    this.scrollManager = new ScrollManager(this, stage.bgKey, stage.scrollSpeed)
    this.bulletPool = new BulletPool(this, 150)
    this.player = new Player(this, 80, GROUND_Y - 48, getSelectedPlayerCharacter())
    this.player.setBulletPool(this.bulletPool)
    if (
      MOBILE_RANGED_AUTOFIRE_ENABLED &&
      !this.sys.game.device.os.desktop &&
      this.player.canAutoFire()
    ) {
      this.player.enableAutoFire()
    }

    this.physics.add.collider(this.player, this.scrollManager.getGround())
    this.enemySpawner = new EnemySpawner(this, this.bulletPool, this.player, stage.spawns)
    this.droppedPowerups = this.physics.add.group({ runChildUpdate: true })
    this.hud = new HUD(this, () => this.openPauseMenu())
    this.hud.setTextTheme(stage.textTheme)
    this.hud.setStage(`STAGE ${stage.id}: ${stage.name}`)
    this.controls = new TouchControls(this)
    this.pauseMenu = new PauseMenu(this, {
      onResume: () => this.resumeFromPauseMenu(),
      onRestart: () => this.restartFromPauseMenu(),
      onExit: () => this.exitFromPauseMenu(),
    })
    this.debugOverlay = new HitboxDebugOverlay(this)
    this.input.keyboard?.on('keydown', this.onKeyDown, this)
    this.setupCollisions()
    this.stageStartTime = this.time.now

    const textTheme = STAGE_TEXT_THEMES[stage.textTheme]
    const stageLabel = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, `STAGE ${stage.id}`, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: textTheme.accent,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setStroke(textTheme.stroke, 4)

    const stageName = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, stage.name, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: textTheme.body,
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setStroke(textTheme.stroke, 3)

    this.tweens.add({
      targets: [stageLabel, stageName],
      alpha: { from: 1, to: 0 },
      delay: 1500,
      duration: 500,
      onComplete: () => {
        stageLabel.destroy()
        stageName.destroy()
      },
    })

    this.cameras.main.fadeIn(300, 0, 0, 0)
  }

  private setupCollisions() {
    this.physics.add.overlap(this.player, this.bulletPool.getGroup(), (_player, bullet) => {
      const currentBullet = bullet as Bullet
      if (currentBullet.active && !currentBullet.isPlayerBullet) {
        if (currentBullet.isBeamHazard) return
        currentBullet.deactivate()
        this.handlePlayerHit()
      }
    })

    this.physics.add.overlap(this.bulletPool.getGroup(), this.enemySpawner.getEnemies(), (bullet, enemy) => {
      const currentBullet = bullet as Bullet
      const currentEnemy = enemy as Enemy
      if (!currentBullet.active || !currentBullet.isPlayerBullet || !currentEnemy.active) return
      if (!currentBullet.canDamageTarget(this.time.now)) return

      currentBullet.deactivate()
      const dead = currentEnemy.takeDamage(currentBullet.damage)
      if (!dead) return
      scoreManager.addKill()
      this.enemySpawner.handleEnemyDeath(currentEnemy)
      this.spawnDeathEffect(currentEnemy.x, currentEnemy.y, currentEnemy.config.particleTint)
      currentEnemy.destroy()
    })

    this.physics.add.overlap(this.player, this.enemySpawner.getEnemies(), (_player, enemy) => {
      const currentEnemy = enemy as Enemy
      this.handlePlayerHit()
      if (currentEnemy.active && currentEnemy.config.moveStyle === 'kamikaze') {
        if (currentEnemy.config.type === 'cap') {
          this.spawnCapExplosion(currentEnemy.x, currentEnemy.y)
        } else {
          this.spawnDeathEffect(currentEnemy.x, currentEnemy.y, currentEnemy.config.particleTint)
        }
        currentEnemy.destroy()
      }
    })

    this.physics.add.overlap(this.player, this.enemySpawner.getItems(), (_player, item) => {
      const currentItem = item as Item
      if (!currentItem.active || !currentItem.canBeCollected()) return
      this.applyItem(currentItem)
      currentItem.destroy()
    })

    this.physics.add.overlap(this.player, this.droppedPowerups, (_player, item) => {
      const currentItem = item as Item
      if (!currentItem.active || !currentItem.canBeCollected()) return
      this.applyItem(currentItem)
      currentItem.destroy()
    })
  }

  private spawnDeathEffect(x: number, y: number, tint = 0xffffff) {
    this.add
      .particles(x, y, 'particle', {
        speed: { min: 30, max: 80 },
        lifespan: 300,
        quantity: 6,
        scale: { start: 1, end: 0 },
        tint,
        emitting: false,
      })
      .explode(6)
  }

  private spawnCapExplosion(x: number, y: number) {
    const flash = this.add
      .circle(x, y, 18, 0xffd76d, 0.46)
      .setDepth(65)
      .setBlendMode(Phaser.BlendModes.ADD)

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2.4,
      duration: 220,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    })

    this.add
      .particles(x, y, 'particle', {
        speed: { min: 70, max: 180 },
        lifespan: 420,
        quantity: 18,
        scale: { start: 1.8, end: 0 },
        tint: [0x1f2c61, 0xffd76d, 0xffffff],
        emitting: false,
      })
      .explode(18)
  }

  private handlePlayerHit() {
    if (this.player.isInvincibleState()) return
    const result = this.player.takeDamage()
    this.spawnDroppedPowerups(result.droppedPowerups)
    this.cameras.main.shake(100, 0.01)
    if (result.dead) {
      this.inputLocked = true
      scoreManager.penalizeDeath()
      this.scene.start('GameOverScene', { stageIndex: this.stageIndex, isBoss: false })
    }
  }

  private applyItem(item: Item) {
    switch (item.itemConfig.effect) {
      case 'heal':
        if (this.player.collectHeart() === 'score') {
          scoreManager.addPoints(ITEM_OVERFLOW_SCORE)
          this.spawnFloatingText(`+${ITEM_OVERFLOW_SCORE}`, item.x, item.y, '#ffd700')
        } else {
          this.spawnFloatingText('HP Up', item.x, item.y, '#ff6f9a')
        }
        break
      case 'invincible':
        this.player.activateStar(item.itemConfig.value)
        this.spawnFloatingText('Shield', item.x, item.y, '#78ddff')
        break
      case 'powerup':
        if (this.player.activatePowerUp(item.itemConfig.value)) {
          this.spawnFloatingText('Power Up', item.x, item.y, '#ffd700')
        } else {
          scoreManager.addPoints(ITEM_OVERFLOW_SCORE)
          this.spawnFloatingText(`+${ITEM_OVERFLOW_SCORE}`, item.x, item.y, '#ffd700')
        }
        break
      case 'score':
        scoreManager.addCoin()
        this.spawnFloatingText('+500', item.x, item.y, '#ffd700')
        break
    }
  }

  private spawnFloatingText(text: string, x: number, y: number, color = '#ffd700') {
    const label = this.add
      .text(x, y - 18, text, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(70)
      .setStroke('#050716', 3)

    this.tweens.add({
      targets: label,
      y: label.y - 28,
      duration: 1200,
      ease: 'Cubic.easeOut',
    })

    this.tweens.add({
      targets: label,
      alpha: 0,
      delay: 620,
      duration: 640,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy(),
    })
  }

  private spawnDroppedPowerups(count: number) {
    for (let index = 0; index < count; index++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const velocity = {
        vx: Math.cos(angle) * DROPPED_POWERUP_SPEED,
        vy: Math.sin(angle) * DROPPED_POWERUP_SPEED,
      }
      const item = new Item(
        this,
        this.player.x,
        this.player.y - 12,
        ITEM_CONFIGS.powerup,
        velocity,
        DROPPED_POWERUP_PICKUP_DELAY,
      )
      this.droppedPowerups.add(item)
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.code !== 'Escape') return
    event.preventDefault()
    this.openPauseMenu()
  }

  private openPauseMenu() {
    if (this.inputLocked || this.stageComplete || this.pauseMenu.isOpen()) return
    this.controls.resetTransientInput()
    this.inputLocked = true
    this.physics.pause()
    this.tweens.pauseAll()
    this.time.paused = true
    this.pauseMenu.open()
  }

  private resumeFromPauseMenu() {
    if (!this.pauseMenu.isOpen()) return
    this.pauseMenu.close()
    this.time.paused = false
    this.physics.resume()
    this.tweens.resumeAll()
    this.controls.resetTransientInput()
    this.inputLocked = false
  }

  private restartFromPauseMenu() {
    this.preparePauseMenuTransition()
    progressStorage.recordAttempt(getSelectedPlayerCharacter(), getSelectedDifficultyId())
    scoreManager.reset()
    runState.reset()
    this.cleanup()
    this.scene.start('StageScene', { stageIndex: 0 })
  }

  private exitFromPauseMenu() {
    this.preparePauseMenuTransition()
    scoreManager.reset()
    runState.reset()
    this.cleanup()
    this.scene.start('TitleScene')
  }

  private preparePauseMenuTransition() {
    this.pauseMenu.close()
    this.time.paused = false
    this.physics.resume()
    this.tweens.resumeAll()
    this.controls.resetTransientInput()
    this.inputLocked = true
  }

  update(time: number, delta: number) {
    if (this.inputLocked) return
    const input = this.controls.getInput()
    if (input.jump) this.player.jump()
    if (input.jumpUp) this.player.cutJump()
    if (input.attackDown) this.player.startAttack()
    if (input.attackUp) this.player.releaseAttack()
    if (input.left) this.player.moveLeft()
    else if (input.right) this.player.moveRight()
    else this.player.stopMove()

    this.player.update(time, delta)
    this.scrollManager.update(time, delta)
    this.enemySpawner.update()
    this.checkShieldBulletHits()
    this.checkBeamHazardHits()
    this.checkPlayerMeleeEnemyHits()
    this.hud.updateHP(this.player.hp, this.player.maxHp)
    this.hud.updatePower(this.player.getPowerDisplayCount(), this.player.getCharacterId())
    this.hud.updateScore(scoreManager.getScore())
    this.updateDebugOverlay()

    const elapsed = time - this.stageStartTime
    const stage = getStageConfig(this.stageIndex)
    if (!this.stageComplete && elapsed >= stage.duration && this.enemySpawner.isAllSpawned()) {
      if (this.enemySpawner.getActiveEnemyCount() === 0) {
        this.stageComplete = true
        this.goToBoss()
      }
    }
  }

  private checkBeamHazardHits() {
    const shieldBounds = this.player.getShieldHitBounds()
    for (const child of this.bulletPool.getGroup().getChildren()) {
      const bullet = child as Bullet
      if (!bullet.active || !bullet.isBeamHazard || bullet.isPlayerBullet) continue
      if (shieldBounds && bullet.intersectsBeamBounds(shieldBounds)) continue
      if (bullet.intersectsBeamTarget(this.player)) {
        this.handlePlayerHit()
      }
    }
  }

  private checkShieldBulletHits() {
    const shieldBounds = this.player.getShieldHitBounds()
    if (!shieldBounds) return
    for (const child of this.bulletPool.getGroup().getChildren()) {
      const bullet = child as Bullet
      if (!bullet.active || bullet.isPlayerBullet || bullet.isBeamHazard) continue
      if (!Phaser.Geom.Intersects.RectangleToRectangle(bullet.getHitBounds(), shieldBounds)) continue
      bullet.deactivate()
    }
  }

  private checkPlayerMeleeEnemyHits() {
    const strikes = this.player.consumeMeleeStrikes()
    if (strikes.length === 0) return

    for (const strike of strikes) {
      for (const child of this.enemySpawner.getEnemies().getChildren()) {
        const enemy = child as Enemy
        if (!enemy.active) continue
        if (!Phaser.Geom.Intersects.RectangleToRectangle(strike.bounds, getArcadeBodyBounds(enemy))) continue
        const dead = enemy.takeDamage(strike.damage)
        if (!dead) continue
        scoreManager.addKill()
        this.enemySpawner.handleEnemyDeath(enemy)
        this.spawnDeathEffect(enemy.x, enemy.y, enemy.config.particleTint)
        enemy.destroy()
      }
    }
  }

  private goToBoss() {
    this.scrollManager.pause()
    const warning = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'WARNING!\nBOSS APPROACHING', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e94560',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(60)

    this.tweens.add({
      targets: warning,
      alpha: { from: 1, to: 0 },
      duration: 300,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        warning.destroy()
        this.inputLocked = true
        const carry = this.createBossCarryState()
        this.cleanup()
        this.scene.start('BossScene', { stageIndex: this.stageIndex, carry })
      },
    })
  }

  private createBossCarryState(): BossCarryState {
    return {
      player: this.player.getCarryState(),
      items: this.collectCarryItems(),
      scrollX: this.scrollManager.getScrollX(),
    }
  }

  private collectCarryItems(): ItemCarryState[] {
    const items = [
      ...this.enemySpawner.getItems().getChildren(),
      ...this.droppedPowerups.getChildren(),
    ] as Item[]
    return items.filter((item) => item.active).map((item) => item.getCarryState())
  }

  private cleanup() {
    this.input.keyboard?.off('keydown', this.onKeyDown, this)
    this.pauseMenu.destroy()
    this.controls.destroy()
    this.hud.destroy()
    this.debugOverlay.destroy()
    this.scrollManager.destroy()
    this.enemySpawner.destroy()
    this.droppedPowerups.clear(true, true)
    this.bulletPool.deactivateAll()
  }

  private updateDebugOverlay() {
    this.debugOverlay.update((overlay) => {
      overlay.drawBody(this.player, 'hurt')
      const shieldBounds = this.player.getShieldHitBounds()
      if (shieldBounds) overlay.drawEffectRect(shieldBounds)
      this.player.getDebugMeleeStrikes().forEach((strike) => overlay.drawAttackRect(strike.bounds))
      this.player.getDebugClawEffects().forEach((effect) => overlay.drawEffectRect(effect.bounds))

      this.enemySpawner.getEnemies().getChildren().forEach((child) => {
        const enemy = child as Enemy
        if (!enemy.active) return
        const bounds = getArcadeBodyBounds(enemy)
        overlay.drawHurtRect(bounds)
        overlay.drawContactAttackRect(bounds)
      })

      this.bulletPool.getGroup().getChildren().forEach((child) => overlay.drawBullet(child as Bullet))
      this.scrollManager
        .getGround()
        .getChildren()
        .forEach((child) => overlay.drawBody(child as Phaser.GameObjects.GameObject, 'wall'))
    })
  }
}
