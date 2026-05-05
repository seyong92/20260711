import Phaser from 'phaser'

import { BOSS_CONFIGS } from '../../content/bosses'
import { ACHIEVEMENT_EVENT, type AchievementId } from '../../content/achievements'
import { getDifficultyConfig, getSelectedDifficultyId } from '../../content/difficulty'
import { getEnemyConfig } from '../../content/enemies'
import { ITEM_CONFIGS } from '../../content/items'
import { getStageConfig, STAGES } from '../../content/stages'
import { PianoBoss } from '../entities/bosses/PianoBoss'
import { ThesisBoss } from '../entities/bosses/ThesisBoss'
import { TrainBoss } from '../entities/bosses/TrainBoss'
import { GAME_WIDTH, GROUND_Y } from '../constants'
import { Enemy } from '../entities/Enemy'
import { Item } from '../entities/Item'
import { MOBILE_RANGED_AUTOFIRE_ENABLED, Player } from '../entities/Player'
import { Bullet, BulletPool } from '../systems/BulletPool'
import { HitboxDebugOverlay } from '../systems/HitboxDebugOverlay'
import { getSelectedPlayerCharacter } from '../systems/PlayerSelection'
import { progressStorage } from '../systems/ProgressStorage'
import { runState } from '../systems/RunState'
import { CURRENT_STAGE_RESTART_SCORE_PENALTY, scoreManager } from '../systems/ScoreManager'
import { ScrollManager } from '../systems/ScrollManager'
import { AutofireToggle } from '../ui/AutofireToggle'
import { HUD } from '../ui/HUD'
import { PauseMenu } from '../ui/PauseMenu'
import { TouchControls } from '../ui/TouchControls'
import { getArcadeBodyBounds } from '../utils/arcadeBounds'
import type { BossCarryState } from './sceneCarry'

const DROPPED_POWERUP_PICKUP_DELAY = 650
const DROPPED_POWERUP_SPEED = 140
const BOSS_MELEE_REACH_BONUS = 0
const CHARGED_BOSS_MELEE_REACH_BONUS = 0
const ITEM_OVERFLOW_SCORE = 500
const HARD_BOSS_MINION_INTERVAL = 8200
const HARD_BOSS_MINION_FIRST_DELAY = HARD_BOSS_MINION_INTERVAL
const HARD_BOSS_MINION_ITEM_DROP_CHANCE = 0.5
const HARD_BOSS_MINION_DROP_ITEMS = ['coin', 'coin', 'heart', 'heart', 'star', 'powerup']

type BossSprite = ThesisBoss | TrainBoss | PianoBoss
type BossWithHitBounds = BossSprite & {
  getHitBounds?: () => Phaser.Geom.Rectangle
  isDamageImmune?: () => boolean
}

export class BossScene extends Phaser.Scene {
  private player!: Player
  private boss!: BossSprite
  private bulletPool!: BulletPool
  private scrollManager!: ScrollManager
  private debugOverlay!: HitboxDebugOverlay
  private hud!: HUD
  private pauseMenu!: PauseMenu
  private controls!: TouchControls
  private autofireToggle: AutofireToggle | null = null
  private droppedPowerups!: Phaser.Physics.Arcade.Group
  private bossMinions!: Phaser.Physics.Arcade.Group
  private stageIndex = 0
  private bossDefeated = false
  private inputLocked = false
  private nextBossItemDropHp = 0
  private bossItemDropInterval = 0
  private bossItemDropIndex = 0
  private nextBossMinionSpawnAt = Number.POSITIVE_INFINITY
  private hardBossMinionTimerStarted = false
  private carry: BossCarryState | null = null

  constructor() {
    super({ key: 'BossScene' })
  }

  init(data: { stageIndex: number; carry?: BossCarryState }) {
    this.stageIndex = data.stageIndex ?? 0
    this.bossDefeated = false
    this.inputLocked = false
    this.hardBossMinionTimerStarted = false
    this.nextBossMinionSpawnAt = Number.POSITIVE_INFINITY
    this.carry = data.carry ?? null
  }

  create() {
    const stage = getStageConfig(this.stageIndex)
    const bgKey = stage.bossBgKey ?? stage.bgKey
    this.scrollManager = new ScrollManager(
      this,
      bgKey,
      0,
      stage.bossType === 'train' ? 'rail' : 'default',
      bgKey === stage.bgKey ? (this.carry?.scrollX ?? 0) : 0,
    )
    this.bulletPool = new BulletPool(this, 150)
    this.player = new Player(this, 80, GROUND_Y - 48, getSelectedPlayerCharacter())
    this.player.setBulletPool(this.bulletPool)
    this.player.applyCarryState(this.carry?.player)
    if (
      MOBILE_RANGED_AUTOFIRE_ENABLED &&
      !this.sys.game.device.os.desktop &&
      this.player.canAutoFire()
    ) {
      this.player.enableAutoFire()
    }
    this.physics.add.collider(this.player, this.scrollManager.getGround())
    this.droppedPowerups = this.physics.add.group({ runChildUpdate: true })
    this.bossMinions = this.physics.add.group({ runChildUpdate: true })
    this.restoreCarryItems()
    this.boss = this.createBoss(stage.bossType)
    this.hud = new HUD(this, () => this.openPauseMenu())
    this.hud.setTextTheme(stage.textTheme)
    this.hud.setStage(`BOSS ${stage.id}: ${stage.name}`)
    this.controls = new TouchControls(this)
    this.autofireToggle = this.player.canAutoFire()
      ? new AutofireToggle(this, {
          getEnabled: () => this.player.isAutoFireEnabled(),
          setEnabled: (enabled) => {
            if (enabled) this.player.enableAutoFire()
            else this.player.disableAutoFire()
          },
        })
      : null
    this.pauseMenu = new PauseMenu(this, {
      onResume: () => this.resumeFromPauseMenu(),
      onRestart: () => this.restartFromPauseMenu(),
      onRestartStage: getSelectedDifficultyId() === 'easy' ? () => this.restartCurrentStageFromPauseMenu() : undefined,
      onExit: () => this.exitFromPauseMenu(),
    })
    this.debugOverlay = new HitboxDebugOverlay(this)
    this.input.keyboard?.on('keydown', this.onKeyDown, this)
    this.bossItemDropInterval = this.boss.maxHp / (getDifficultyConfig().bossItemSequence.length + 1)
    this.nextBossItemDropHp = this.boss.maxHp - this.bossItemDropInterval
    this.bossItemDropIndex = 0
    this.nextBossMinionSpawnAt = Number.POSITIVE_INFINITY
    this.setupCollisions()
  }

  private createBoss(type: string) {
    switch (type) {
      case 'train':
        return new TrainBoss(this, this.bulletPool)
      case 'piano':
        return new PianoBoss(this, this.bulletPool)
      case 'thesis':
      default:
        return new ThesisBoss(this, this.bulletPool, this.player, () => {
          runState.markDefenseFailure(this.stageIndex)
          this.handlePlayerHit()
        })
    }
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
    this.physics.add.overlap(this.player, this.droppedPowerups, (_player, item) => {
      const currentItem = item as Item
      if (!currentItem.active || !currentItem.canBeCollected()) return
      this.applyItem(currentItem)
      currentItem.destroy()
    })
    this.physics.add.overlap(this.player, this.bossMinions, (_player, enemy) => {
      const currentEnemy = enemy as Enemy
      this.handlePlayerHit()
      if (currentEnemy.active && currentEnemy.config.moveStyle === 'kamikaze') {
        this.spawnBossMinionDeathEffect(currentEnemy)
        currentEnemy.destroy()
      }
    })
  }

  private handlePlayerHit() {
    if (this.player.isInvincibleState()) return
    runState.markBossHit(this.stageIndex)
    const result = this.player.takeDamage()
    this.spawnDroppedPowerups(result.droppedPowerups)
    this.cameras.main.shake(100, 0.01)
    if (result.dead) {
      this.inputLocked = true
      scoreManager.penalizeDeath()
      this.scene.start('GameOverScene', { stageIndex: this.stageIndex, isBoss: true })
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

  private restoreCarryItems() {
    this.carry?.items?.forEach((state) => {
      const config = ITEM_CONFIGS[state.type]
      if (!config) return
      const item = new Item(
        this,
        state.x,
        state.y,
        config,
        { vx: state.vx, vy: state.vy },
        state.collectDelayMs,
      )
      this.droppedPowerups.add(item)
    })
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.code !== 'Escape') return
    event.preventDefault()
    this.openPauseMenu()
  }

  private openPauseMenu() {
    if (this.inputLocked || this.bossDefeated || this.pauseMenu.isOpen()) return
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

  private restartCurrentStageFromPauseMenu() {
    this.preparePauseMenuTransition()
    progressStorage.recordAttempt(getSelectedPlayerCharacter(), getSelectedDifficultyId())
    scoreManager.penalizePercent(CURRENT_STAGE_RESTART_SCORE_PENALTY)
    runState.reset()
    this.cleanup()
    this.scene.start('StageScene', { stageIndex: this.stageIndex })
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

  private onBossDefeated() {
    scoreManager.addBossKill()
    const unlockedAchievements = progressStorage.recordStageClear(
      getSelectedPlayerCharacter(),
      getSelectedDifficultyId(),
      this.stageIndex,
    )
    unlockedAchievements.push(...this.unlockSpecialAchievements())
    this.emitUnlockedAchievements(unlockedAchievements)
    this.add
      .particles(this.boss.x, this.boss.y, 'particle', {
        speed: { min: 50, max: 150 },
        lifespan: 600,
        quantity: 20,
        scale: { start: 2, end: 0 },
        emitting: false,
      })
      .explode(20)

    this.boss.destroy()
    this.bossMinions.clear(true, true)
    this.bulletPool.deactivateAll()
    const bossConfig = BOSS_CONFIGS[getStageConfig(this.stageIndex).bossType]
    const clearText = this.add
      .text(GAME_WIDTH / 2, 330, bossConfig.clearText, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffd700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(60)

    this.tweens.add({
      targets: clearText,
      scale: { from: 0.5, to: 1.2 },
      alpha: { from: 0, to: 1 },
      duration: 600,
      ease: 'Back.easeOut',
    })

    this.time.delayedCall(2500, () => {
      clearText.destroy()
      this.goToNextStage()
    })
  }

  private unlockSpecialAchievements() {
    const ids: AchievementId[] = []
    if (this.stageIndex === 0 && !runState.hasBossHit(0)) {
      ids.push('stage-1-train-no-hit')
    }
    if (this.stageIndex === 1 && !runState.hasDefenseFailure(1)) {
      ids.push('stage-2-defense-no-hit')
    }
    if (this.stageIndex === 2 && !runState.hasCameraBeamHit(2)) {
      ids.push('stage-3-camera-no-hit')
    }
    return progressStorage.unlockAchievements(ids)
  }

  private emitUnlockedAchievements(ids: AchievementId[]) {
    if (ids.length > 0) {
      this.game.events.emit(ACHIEVEMENT_EVENT, ids)
    }
  }

  private goToNextStage() {
    this.inputLocked = true
    this.cameras.main.fadeOut(500, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.cleanup()
      if (this.stageIndex < STAGES.length - 1) {
        this.scene.start('StoryScene', {
          sequenceId: this.stageIndex === 0 ? 'afterStage1' : 'afterStage2',
          nextScene: 'StageScene',
          nextData: { stageIndex: this.stageIndex + 1 },
        })
      } else {
        this.scene.start('StoryScene', {
          sequenceId: 'ending',
          completeRun: true,
        })
      }
    })
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
    if (this.boss.active) {
      this.boss.update(time, delta)
      if (this.boss.body) {
        ;(this.boss.body as Phaser.Physics.Arcade.Body).updateFromGameObject()
      }
    }
    this.updateHardBossMinions(time)

    this.checkPlayerBossBodyHits()
    this.checkShieldBulletHits()
    this.checkBeamHazardHits()
    this.checkPlayerMeleeBossHits()
    this.checkPlayerBulletDestructibleHits()
    this.checkBulletBossMinionHits()
    this.checkBulletBossHits()
    this.hud.updateHP(this.player.hp, this.player.maxHp)
    this.hud.updatePower(this.player.getPowerDisplayCount(), this.player.getCharacterId())
    this.hud.updateScore(scoreManager.getScore())
    if (this.boss.active) {
      this.updateBossHPBar()
    }
    this.updateDebugOverlay()
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

  private checkPlayerBossBodyHits() {
    if (!this.boss.active || this.bossDefeated) return
    if (Phaser.Geom.Intersects.RectangleToRectangle(getArcadeBodyBounds(this.player), this.getBossHitBounds())) {
      this.handlePlayerHit()
    }
  }

  private checkBulletBossHits() {
    if (!this.boss.active || this.bossDefeated) return
    const bossBounds = this.getBossHitBounds()
    for (const child of this.bulletPool.getGroup().getChildren()) {
      const bullet = child as Bullet
      if (!bullet.active || !bullet.isPlayerBullet) continue
      if (!bullet.canDamageTarget(this.time.now)) continue
      if (!Phaser.Geom.Intersects.RectangleToRectangle(bullet.getHitBounds(), bossBounds)) continue
      this.spawnPlayerBulletImpact(bullet.x, bullet.y, bullet.isChargedBullet)
      bullet.deactivate()
      if (this.isBossDamageImmune()) continue
      const dead = this.boss.takeDamage(bullet.damage)
      if (dead) {
        this.bossDefeated = true
        this.updateBossHPBar(0)
        this.onBossDefeated()
        return
      }
      this.dropBossItemIfNeeded()
    }
  }

  private checkBulletBossMinionHits() {
    for (const child of this.bulletPool.getGroup().getChildren()) {
      const bullet = child as Bullet
      if (!bullet.active || !bullet.isPlayerBullet) continue
      if (!bullet.canDamageTarget(this.time.now)) continue

      for (const enemyChild of this.bossMinions.getChildren()) {
        const enemy = enemyChild as Enemy
        if (!enemy.active) continue
        if (!Phaser.Geom.Intersects.RectangleToRectangle(bullet.getHitBounds(), getArcadeBodyBounds(enemy))) continue
        bullet.deactivate()
        const dead = enemy.takeDamage(bullet.damage)
        if (dead) {
          scoreManager.addKill()
          this.dropRandomBossMinionItem(enemy.x, enemy.y)
          this.spawnBossMinionDeathEffect(enemy)
          enemy.destroy()
        }
        break
      }
    }
  }

  private checkPlayerBulletDestructibleHits() {
    const bullets = this.bulletPool.getGroup().getChildren() as Bullet[]
    const playerBullets = bullets.filter((bullet) => bullet.active && bullet.isPlayerBullet)
    const destructibleBullets = bullets.filter(
      (bullet) => bullet.active && !bullet.isPlayerBullet && bullet.isDestructibleEnemyBullet,
    )
    if (playerBullets.length === 0 || destructibleBullets.length === 0) return

    for (const playerBullet of playerBullets) {
      for (const enemyBullet of destructibleBullets) {
        if (!playerBullet.active || !enemyBullet.active) continue
        if (!playerBullet.canDamageTarget(this.time.now)) continue
        if (!Phaser.Geom.Intersects.RectangleToRectangle(playerBullet.getHitBounds(), enemyBullet.getHitBounds())) {
          continue
        }
        playerBullet.deactivate()
        const destroyed = enemyBullet.damageDestructible(playerBullet.damage)
        if (destroyed) {
          this.spawnDestructibleBulletBreak(enemyBullet.x, enemyBullet.y)
          enemyBullet.deactivate()
        }
        break
      }
    }
  }

  private spawnPlayerBulletImpact(x: number, y: number, charged: boolean) {
    const color = charged ? 0xffe08a : 0xff8fc7
    const glow = this.add.circle(x, y, charged ? 9 : 5, color, charged ? 0.42 : 0.34)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD)
    this.tweens.add({
      targets: glow,
      alpha: 0,
      scale: charged ? 2.1 : 1.65,
      duration: charged ? 150 : 100,
      ease: 'Cubic.easeOut',
      onComplete: () => glow.destroy(),
    })

    if (!charged) return
    this.add
      .particles(x, y, 'particle', {
        speed: { min: 18, max: 58 },
        lifespan: 180,
        quantity: 4,
        scale: { start: 0.9, end: 0 },
        tint: color,
        emitting: false,
      })
      .explode(4)
  }

  private checkPlayerMeleeBossHits() {
    const strikes = this.player.consumeMeleeStrikes()
    this.checkMeleeDestructibleHits(strikes)
    this.checkMeleeBossMinionHits(strikes)
    if (!this.boss.active || this.bossDefeated) return
    const bossBounds = this.getBossHitBounds()
    for (const strike of strikes) {
      if (!Phaser.Geom.Intersects.RectangleToRectangle(this.getBossMeleeBounds(strike), bossBounds)) continue
      if (this.isBossDamageImmune()) continue
      const dead = this.boss.takeDamage(strike.damage)
      if (dead) {
        this.bossDefeated = true
        this.updateBossHPBar(0)
        this.onBossDefeated()
        return
      }
      this.dropBossItemIfNeeded()
    }
  }

  private checkMeleeBossMinionHits(strikes: Array<{ bounds: Phaser.Geom.Rectangle; damage: number }>) {
    if (strikes.length === 0) return
    for (const strike of strikes) {
      for (const child of this.bossMinions.getChildren()) {
        const enemy = child as Enemy
        if (!enemy.active) continue
        if (!Phaser.Geom.Intersects.RectangleToRectangle(strike.bounds, getArcadeBodyBounds(enemy))) continue
        const dead = enemy.takeDamage(strike.damage)
        if (dead) {
          scoreManager.addKill()
          this.dropRandomBossMinionItem(enemy.x, enemy.y)
          this.spawnBossMinionDeathEffect(enemy)
          enemy.destroy()
        }
      }
    }
  }

  private checkMeleeDestructibleHits(strikes: Array<{ bounds: Phaser.Geom.Rectangle; damage: number }>) {
    if (strikes.length === 0) return
    const destructibleBullets = (this.bulletPool.getGroup().getChildren() as Bullet[]).filter(
      (bullet) => bullet.active && !bullet.isPlayerBullet && bullet.isDestructibleEnemyBullet,
    )
    if (destructibleBullets.length === 0) return

    for (const strike of strikes) {
      for (const enemyBullet of destructibleBullets) {
        if (!enemyBullet.active) continue
        if (!Phaser.Geom.Intersects.RectangleToRectangle(strike.bounds, enemyBullet.getHitBounds())) continue
        const destroyed = enemyBullet.damageDestructible(strike.damage)
        if (destroyed) {
          this.spawnDestructibleBulletBreak(enemyBullet.x, enemyBullet.y)
          enemyBullet.deactivate()
        }
      }
    }
  }

  private spawnDestructibleBulletBreak(x: number, y: number) {
    this.add
      .particles(x, y, 'particle', {
        speed: { min: 25, max: 85 },
        lifespan: 260,
        quantity: 8,
        scale: { start: 1, end: 0 },
        tint: 0xf6d7b0,
        emitting: false,
      })
      .explode(8)
  }

  private dropBossItemIfNeeded() {
    const itemSequence = getDifficultyConfig().bossItemSequence
    while (this.boss.hp <= this.nextBossItemDropHp && this.nextBossItemDropHp > 0) {
      const itemType = itemSequence[this.bossItemDropIndex % itemSequence.length]
      this.bossItemDropIndex++
      this.spawnBossItem(itemType)
      this.nextBossItemDropHp -= this.bossItemDropInterval
    }
  }

  private spawnBossItem(type: string) {
    const config = ITEM_CONFIGS[type]
    if (!config) return
    const item = new Item(this, this.boss.x - 20, this.boss.y, config, {
      vx: Phaser.Math.Between(-120, -70),
      vy: Phaser.Math.Between(-80, 30),
    })
    this.droppedPowerups.add(item)
  }

  private updateHardBossMinions(time: number) {
    if (getDifficultyConfig().id !== 'hard' || this.bossDefeated || !this.boss.active) return

    if (!this.hardBossMinionTimerStarted) {
      this.hardBossMinionTimerStarted = true
      this.nextBossMinionSpawnAt = time + HARD_BOSS_MINION_FIRST_DELAY
      return
    }

    if (time < this.nextBossMinionSpawnAt || this.bossMinions.countActive() > 0) return

    this.spawnHardBossMinion()
    this.nextBossMinionSpawnAt = time + HARD_BOSS_MINION_INTERVAL
  }

  private spawnHardBossMinion() {
    const enemyTypes = Array.from(new Set(getStageConfig(this.stageIndex, 'hard').spawns.map((spawn) => spawn.enemyType)))
    const enemyType = Phaser.Utils.Array.GetRandom(enemyTypes)
    const config = getEnemyConfig(enemyType, 'hard')
    if (!config) return

    const stageSpawns = getStageConfig(this.stageIndex, 'hard').spawns.filter((spawn) => spawn.enemyType === enemyType)
    const spawnY = Phaser.Utils.Array.GetRandom(stageSpawns)?.y ?? GROUND_Y - 170
    const enemy = new Enemy(this, GAME_WIDTH + 28, spawnY, config)
    enemy.setBulletPool(this.bulletPool)
    enemy.setPlayerRef(this.player)
    this.bossMinions.add(enemy)
  }

  private dropRandomBossMinionItem(x: number, y: number) {
    if (Math.random() >= HARD_BOSS_MINION_ITEM_DROP_CHANCE) return
    const itemType = Phaser.Utils.Array.GetRandom(HARD_BOSS_MINION_DROP_ITEMS)
    const config = ITEM_CONFIGS[itemType]
    if (!config) return
    const item = new Item(this, x, y, config, {
      vx: Phaser.Math.Between(-110, -55),
      vy: Phaser.Math.Between(-90, 25),
    })
    this.droppedPowerups.add(item)
  }

  private spawnBossMinionDeathEffect(enemy: Enemy) {
    this.add
      .particles(enemy.x, enemy.y, 'particle', {
        speed: { min: 30, max: 80 },
        lifespan: 300,
        quantity: 6,
        scale: { start: 1, end: 0 },
        tint: enemy.config.particleTint,
        emitting: false,
      })
      .explode(6)
  }

  private getBossHitBounds() {
    return (this.boss as BossWithHitBounds).getHitBounds?.() ?? this.boss.getBounds()
  }

  private isBossDamageImmune() {
    return (this.boss as BossWithHitBounds).isDamageImmune?.() ?? false
  }

  private getBossMeleeBounds(strike: { bounds: Phaser.Geom.Rectangle; charged: boolean }) {
    const bonus = strike.charged ? CHARGED_BOSS_MELEE_REACH_BONUS : BOSS_MELEE_REACH_BONUS
    return new Phaser.Geom.Rectangle(strike.bounds.x, strike.bounds.y, strike.bounds.width + bonus, strike.bounds.height)
  }

  private updateBossHPBar(current = this.boss.hp) {
    const bossConfig = BOSS_CONFIGS[getStageConfig(this.stageIndex).bossType]
    this.hud.showBossHP(bossConfig.type.toUpperCase(), current, this.boss.maxHp)
  }

  private cleanup() {
    this.input.keyboard?.off('keydown', this.onKeyDown, this)
    this.pauseMenu.destroy()
    this.autofireToggle?.destroy()
    this.autofireToggle = null
    this.controls.destroy()
    this.hud.destroy()
    this.debugOverlay.destroy()
    this.scrollManager.destroy()
    this.droppedPowerups.clear(true, true)
    this.bossMinions.clear(true, true)
    this.bulletPool.deactivateAll()
  }

  private updateDebugOverlay() {
    this.debugOverlay.update((overlay) => {
      overlay.drawBody(this.player, 'hurt')
      const shieldBounds = this.player.getShieldHitBounds()
      if (shieldBounds) overlay.drawEffectRect(shieldBounds)
      this.player.getDebugMeleeStrikes().forEach((strike) => {
        overlay.drawAttackRect(this.getBossMeleeBounds(strike))
      })
      this.player.getDebugClawEffects().forEach((effect) => overlay.drawEffectRect(effect.bounds))

      if (this.boss.active) {
        const bossBounds = this.getBossHitBounds()
        overlay.drawHurtRect(bossBounds)
        overlay.drawContactAttackRect(bossBounds)
      }

      this.bossMinions.getChildren().forEach((child) => {
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
