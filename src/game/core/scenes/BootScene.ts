import Phaser from 'phaser'

import gameOverBgUrl from '../../assets/backgrounds/game-over-bg.png'
import achievementBouquetIconUrl from '../../assets/achievements/bouquet.png'
import achievementCameraIconUrl from '../../assets/achievements/camera.png'
import achievementCapIconUrl from '../../assets/achievements/cap.png'
import achievementDoubleCapIconUrl from '../../assets/achievements/double-cap.png'
import achievementHeartIconUrl from '../../assets/achievements/heart.png'
import achievementReunionIconUrl from '../../assets/achievements/reunion.png'
import achievementRingIconUrl from '../../assets/achievements/ring.png'
import achievementThesisIconUrl from '../../assets/achievements/thesis.png'
import achievementTicketIconUrl from '../../assets/achievements/ticket.png'
import stage1BgUrl from '../../assets/backgrounds/stage1-long-distance-bg-v3.png'
import stage2BgUrl from '../../assets/backgrounds/stage2-wedding-prep-bg-v2.png'
import stage3DefenseClassroomBgUrl from '../../assets/backgrounds/stage3-defense-classroom-bg.png'
import stage3BgUrl from '../../assets/backgrounds/stage3-kaist-campus-bg.png'
import titleBgBrideUrl from '../../assets/backgrounds/title-bg-bride-fantasy-pixel-v4.png'
import titleBgDragonUrl from '../../assets/backgrounds/title-bg-dragon-fantasy-pixel-v5.png'
import titleLogoBrideUrl from '../../assets/title/title-logo-bride.png'
import titleLogoDragonUrl from '../../assets/title/title-logo-dragon.png'
import basicBulletSpriteUrl from '../../assets/sprites/basic_bullet-v5-notes.png'
import bossFlowerBulletSpriteUrl from '../../assets/sprites/basic_bullet-v3.png'
import bossPianoSpriteUrl from '../../assets/sprites/boss-piano-v2.png'
import bossThesisSpriteUrl from '../../assets/sprites/boss-thesis-v2.png'
import bossTrainSpriteUrl from '../../assets/sprites/boss-train-v5.png'
import bossBouquetSpriteUrl from '../../assets/sprites/charged_bullet-v4.png'
import chargedBulletSpriteUrl from '../../assets/sprites/charged_bullet-v7-staccato-chord.png'
import doctorDefenseShieldSpriteUrl from '../../assets/sprites/doctor-defense-shield-v4.png'
import dragonClawScratchSpriteUrl from '../../assets/sprites/dragon-claw-scratch-v3.png'
import dragonPlayerSpriteUrl from '../../assets/sprites/dragon-player-v14.png'
import dragonSpriteUrl from '../../assets/sprites/dragon-v3.png'
import enemiesSpriteUrl from '../../assets/sprites/enemies-v6.png'
import enemyBulletsSpriteUrl from '../../assets/sprites/enemy_bullets-v5.png'
import heroSpriteUrl from '../../assets/sprites/hero-v15-keytar.png'
import itemPickupsSpriteUrl from '../../assets/sprites/item-pickups-v8.png'
import playerShieldSpriteUrl from '../../assets/sprites/player-shield-v2.png'
import {
  getGameModeContent,
  getStoryImageKey,
  getStoryRevealImageKey,
  getStoryImageUrl,
  STORY_SEQUENCE_IDS,
} from '../../content/gameContent'
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../constants'

export class BootScene extends Phaser.Scene {
  private static readonly HERO_FRAME_WIDTH = 160
  private static readonly HERO_FRAME_HEIGHT = 224
  private static readonly DRAGON_PLAYER_FRAME_WIDTH = 288
  private static readonly DRAGON_PLAYER_FRAME_HEIGHT = 195
  private static readonly DRAGON_FRAME_WIDTH = 44
  private static readonly DRAGON_FRAME_HEIGHT = 69
  private static readonly DRAGON_CLAW_SCRATCH_FRAME_WIDTH = 280
  private static readonly DRAGON_CLAW_SCRATCH_FRAME_HEIGHT = 181
  private static readonly BASIC_BULLET_FRAME_SIZE = 64
  private static readonly CHARGED_BULLET_FRAME_SIZE = 96
  private static readonly BOSS_FRAME_SIZE = 64
  private static readonly TRAIN_BOSS_FRAME_WIDTH = 96
  private static readonly TRAIN_BOSS_FRAME_HEIGHT = 64

  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    this.createLoadingBar()
    this.load.image('title-bg', titleBgBrideUrl)
    this.load.image('title-bg-bride', titleBgBrideUrl)
    this.load.image('title-bg-dragon', titleBgDragonUrl)
    this.load.image('title-logo-bride', titleLogoBrideUrl)
    this.load.image('title-logo-dragon', titleLogoDragonUrl)
    this.load.image('stage1-bg', stage1BgUrl)
    this.load.image('stage2-bg', stage2BgUrl)
    this.load.image('stage3-bg', stage3BgUrl)
    this.load.image('stage3-boss-bg', stage3DefenseClassroomBgUrl)
    this.load.image('game-over-bg', gameOverBgUrl)
    this.load.image('achievement-bouquet', achievementBouquetIconUrl)
    this.load.image('achievement-camera', achievementCameraIconUrl)
    this.load.image('achievement-cap', achievementCapIconUrl)
    this.load.image('achievement-double-cap', achievementDoubleCapIconUrl)
    this.load.image('achievement-heart', achievementHeartIconUrl)
    this.load.image('achievement-reunion', achievementReunionIconUrl)
    this.load.image('achievement-ring', achievementRingIconUrl)
    this.load.image('achievement-thesis', achievementThesisIconUrl)
    this.load.image('achievement-ticket', achievementTicketIconUrl)
    this.loadStoryImages()
    this.load.spritesheet('basic-bullet', basicBulletSpriteUrl, {
      frameWidth: BootScene.BASIC_BULLET_FRAME_SIZE,
      frameHeight: BootScene.BASIC_BULLET_FRAME_SIZE,
    })
    this.load.spritesheet('charged-bullet', chargedBulletSpriteUrl, {
      frameWidth: BootScene.CHARGED_BULLET_FRAME_SIZE,
      frameHeight: BootScene.CHARGED_BULLET_FRAME_SIZE,
    })
    this.load.image('boss-bouquet', bossBouquetSpriteUrl)
    this.load.image('boss-flower-bullet', bossFlowerBulletSpriteUrl)
    this.load.image('doctor-defense-shield', doctorDefenseShieldSpriteUrl)
    this.load.image('player-shield', playerShieldSpriteUrl)
    this.load.spritesheet('dragon-claw-scratch', dragonClawScratchSpriteUrl, {
      frameWidth: BootScene.DRAGON_CLAW_SCRATCH_FRAME_WIDTH,
      frameHeight: BootScene.DRAGON_CLAW_SCRATCH_FRAME_HEIGHT,
    })
    this.load.spritesheet('item-pickups', itemPickupsSpriteUrl, {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    })
    this.load.spritesheet('boss-piano', bossPianoSpriteUrl, {
      frameWidth: BootScene.BOSS_FRAME_SIZE,
      frameHeight: BootScene.BOSS_FRAME_SIZE,
    })
    this.load.spritesheet('boss-thesis', bossThesisSpriteUrl, {
      frameWidth: BootScene.BOSS_FRAME_SIZE,
      frameHeight: BootScene.BOSS_FRAME_SIZE,
    })
    this.load.spritesheet('boss-train', bossTrainSpriteUrl, {
      frameWidth: BootScene.TRAIN_BOSS_FRAME_WIDTH,
      frameHeight: BootScene.TRAIN_BOSS_FRAME_HEIGHT,
    })
    this.load.spritesheet('dragon', dragonSpriteUrl, {
      frameWidth: BootScene.DRAGON_FRAME_WIDTH,
      frameHeight: BootScene.DRAGON_FRAME_HEIGHT,
    })
    this.load.spritesheet('dragon-player', dragonPlayerSpriteUrl, {
      frameWidth: BootScene.DRAGON_PLAYER_FRAME_WIDTH,
      frameHeight: BootScene.DRAGON_PLAYER_FRAME_HEIGHT,
    })
    this.load.spritesheet('enemies', enemiesSpriteUrl, {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    })
    this.load.spritesheet('enemy-bullets', enemyBulletsSpriteUrl, {
      frameWidth: 16,
      frameHeight: 16,
    })
    this.load.spritesheet('hero', heroSpriteUrl, {
      frameWidth: BootScene.HERO_FRAME_WIDTH,
      frameHeight: BootScene.HERO_FRAME_HEIGHT,
    })
  }

  private loadStoryImages() {
    ;(['bride', 'dragon'] as const).forEach((character) => {
      const modeContent = getGameModeContent(character)
      STORY_SEQUENCE_IDS.forEach((sequenceId) => {
        modeContent.storySequences[sequenceId].forEach((slide, slideIndex) => {
          if (slide.variant === 'blackout' || !slide.fileName) return
          this.load.image(
            getStoryImageKey(character, sequenceId, slideIndex),
            getStoryImageUrl(character, slide.fileName),
          )
          if (slide.revealFileName) {
            this.load.image(
              getStoryRevealImageKey(character, sequenceId, slideIndex),
              getStoryImageUrl(character, slide.revealFileName),
            )
          }
        })
      })
    })
  }

  create() {
    this.textures.get('hero').setFilter(Phaser.Textures.FilterMode.LINEAR)
    this.textures.get('dragon-player').setFilter(Phaser.Textures.FilterMode.LINEAR)
    this.generateCanvasAssets()
    this.createAnimations()
    this.scene.launch('AchievementOverlayScene')
    this.scene.start('TitleScene')
  }

  private createLoadingBar() {
    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x0f3460, 0.8)
    progressBox.fillRect(GAME_WIDTH / 2 - 120, GAME_HEIGHT / 2 - 15, 240, 30)
    const loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e0e0e0',
    })
    loadingText.setOrigin(0.5)
    this.load.on('progress', (value: number) => {
      progressBar.clear()
      progressBar.fillStyle(0xe94560, 1)
      progressBar.fillRect(GAME_WIDTH / 2 - 116, GAME_HEIGHT / 2 - 11, 232 * value, 22)
    })
    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
    })
  }

  private drawToCanvasTexture(
    key: string,
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ) {
    const canvasTexture = this.textures.createCanvas(key, width, height)
    if (!canvasTexture) return
    const ctx = canvasTexture.getContext()
    draw(ctx)
    canvasTexture.refresh()
  }

  private generateCanvasAssets() {
    this.generateTextureFallbacks()

    this.drawToCanvasTexture('ground-collider', 4, 4, (ctx) => {
      ctx.clearRect(0, 0, 4, 4)
    })
    this.createGroundTextures()

    if (!this.textures.exists('stage1-bg')) {
      this.drawToCanvasTexture('stage1-bg', GAME_WIDTH, GAME_HEIGHT, (ctx) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
        gradient.addColorStop(0, '#14254a')
        gradient.addColorStop(0.5, '#214479')
        gradient.addColorStop(1, '#0c1733')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      })
    }

    if (!this.textures.exists('stage2-bg')) {
      this.drawToCanvasTexture('stage2-bg', GAME_WIDTH, GAME_HEIGHT, (ctx) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
        gradient.addColorStop(0, '#f4ecdf')
        gradient.addColorStop(0.45, '#e8d3be')
        gradient.addColorStop(1, '#c4a88c')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      })
    }

    if (!this.textures.exists('stage3-bg')) {
      this.drawToCanvasTexture('stage3-bg', GAME_WIDTH, GAME_HEIGHT, (ctx) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
        gradient.addColorStop(0, '#241c3e')
        gradient.addColorStop(0.5, '#3a315e')
        gradient.addColorStop(1, '#171126')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      })
    }

    this.drawToCanvasTexture('particle', 4, 4, (ctx) => {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, 4, 4)
    })
  }

  private createGroundTextures() {
    const palettes = {
      stage1: {
        top: '#86674e',
        mid: '#5f493b',
        low: '#2e2727',
        edge: '#c7987a',
        detail: ['#e68da9', '#f2c2cc', '#395b35', '#253f2a'],
      },
      stage2: {
        top: '#d8b990',
        mid: '#9d7755',
        low: '#59412f',
        edge: '#f2d5a4',
        detail: ['#ffffff', '#ffd1dd', '#8aa86a', '#c99662'],
      },
      stage3: {
        top: '#b7a57d',
        mid: '#74674d',
        low: '#342c28',
        edge: '#f2dfaa',
        detail: ['#7bb36a', '#d7c28c', '#6b8fc4', '#d48b74'],
      },
    }

    Object.entries(palettes).forEach(([stage, palette]) => {
      this.drawToCanvasTexture(`ground-${stage}`, 192, 128, (ctx) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 128)
        gradient.addColorStop(0, palette.top)
        gradient.addColorStop(0.36, palette.mid)
        gradient.addColorStop(1, palette.low)
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 192, 128)

        ctx.fillStyle = palette.edge
        ctx.fillRect(0, 0, 192, 4)
        ctx.fillStyle = 'rgba(255,255,255,0.16)'
        ctx.fillRect(0, 5, 192, 1)
        ctx.fillStyle = 'rgba(0,0,0,0.18)'
        ctx.fillRect(0, 19, 192, 3)

        for (let x = -12; x < 210; x += 24) {
          const y = 26 + ((x / 24) % 3) * 11
          ctx.fillStyle = 'rgba(255,255,255,0.07)'
          ctx.fillRect(x + 4, y, 18, 2)
          ctx.fillStyle = 'rgba(0,0,0,0.18)'
          ctx.fillRect(x, y + 16, 26, 3)
        }

        for (let index = 0; index < 34; index++) {
          const x = (index * 37) % 192
          const y = 6 + ((index * 23) % 72)
          ctx.fillStyle = palette.detail[index % palette.detail.length]
          if (index % 4 === 0) {
            ctx.fillRect(x, y, 5, 2)
            ctx.fillRect(x + 2, y - 1, 2, 4)
          } else if (index % 4 === 1) {
            ctx.fillRect(x, y, 3, 3)
          } else {
            ctx.fillRect(x, y, 7, 1)
          }
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.16)'
        ctx.lineWidth = 1
        for (let index = 0; index < 12; index++) {
          const x = (index * 43) % 192
          const y = 32 + ((index * 31) % 82)
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + 8 + (index % 3) * 4, y + 3)
          ctx.lineTo(x + 14 + (index % 4) * 3, y + 10)
          ctx.stroke()
        }
      })
    })

    this.drawToCanvasTexture('ground-stage3-boss', 192, 128, (ctx) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 128)
      gradient.addColorStop(0, '#c7a57f')
      gradient.addColorStop(0.18, '#9a7658')
      gradient.addColorStop(1, '#3b312d')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 192, 128)

      ctx.fillStyle = '#ead2b2'
      ctx.fillRect(0, 0, 192, 4)
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(0, 5, 192, 1)
      ctx.fillStyle = '#7e5f47'
      ctx.fillRect(0, 11, 192, 7)
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.fillRect(0, 18, 192, 2)

      ctx.strokeStyle = 'rgba(255,232,196,0.1)'
      ctx.lineWidth = 1
      for (let y = 32; y < 124; y += 24) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(192, y)
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(16,14,16,0.34)'
      for (let x = -24; x < 220; x += 48) {
        ctx.beginPath()
        ctx.moveTo(x, 22)
        ctx.lineTo(x + 24, 128)
        ctx.stroke()
      }

      for (let index = 0; index < 26; index++) {
        const x = (index * 37) % 192
        const y = 26 + ((index * 29) % 84)
        ctx.fillStyle = index % 3 === 0 ? '#c0956f' : index % 3 === 1 ? '#77614f' : '#d3b28d'
        ctx.fillRect(x, y, 4 + (index % 3) * 2, 1)
      }

      ctx.fillStyle = 'rgba(0,0,0,0.24)'
      for (let x = 0; x < 192; x += 64) {
        ctx.fillRect(x, 126, 38, 2)
      }
    })

    this.drawToCanvasTexture('ground-rail-stage1', 192, 128, (ctx) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 128)
      gradient.addColorStop(0, '#4a423b')
      gradient.addColorStop(0.32, '#312f31')
      gradient.addColorStop(1, '#17181f')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 192, 128)

      ctx.fillStyle = '#62564b'
      ctx.fillRect(0, 0, 192, 4)
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.fillRect(0, 5, 192, 1)
      ctx.fillStyle = 'rgba(0,0,0,0.32)'
      ctx.fillRect(0, 62, 192, 5)

      for (let x = -10; x < 210; x += 26) {
        ctx.fillStyle = '#49372d'
        ctx.fillRect(x, 22, 18, 22)
        ctx.fillStyle = '#6f5746'
        ctx.fillRect(x + 2, 24, 14, 3)
        ctx.fillStyle = 'rgba(0,0,0,0.24)'
        ctx.fillRect(x, 40, 18, 4)
      }

      const drawSideRail = (y: number, highlightAlpha: number) => {
        ctx.fillStyle = '#20242a'
        ctx.fillRect(0, y + 5, 192, 3)
        ctx.fillStyle = '#d2d8dd'
        ctx.fillRect(0, y, 192, 3)
        ctx.fillStyle = '#7a828a'
        ctx.fillRect(0, y + 3, 192, 3)
        ctx.fillStyle = `rgba(255,255,232,${highlightAlpha})`
        ctx.fillRect(0, y, 192, 1)
      }
      drawSideRail(18, 0.48)
      drawSideRail(34, 0.66)

      ctx.fillStyle = '#252930'
      for (let index = 0; index < 58; index++) {
        const x = (index * 29) % 192
        const y = 68 + ((index * 17) % 44)
        ctx.fillRect(x, y, 4 + (index % 4), 2)
      }

      ctx.fillStyle = '#d88ca2'
      for (let index = 0; index < 14; index++) {
        const x = (index * 53) % 192
        const y = 8 + ((index * 23) % 104)
        ctx.fillRect(x, y, 4, 2)
      }
    })
  }

  private generateTextureFallbacks() {
    if (!this.textures.exists('enemies')) {
      this.drawToCanvasTexture('enemies', TILE_SIZE * 6, TILE_SIZE, (ctx) => {
        const colors = ['#72604d', '#3f6eb3', '#d9a7b0', '#f3f0e6', '#1f2c61', '#cbb38d']
        for (let index = 0; index < 6; index++) {
          ctx.fillStyle = colors[index]
          ctx.fillRect(index * TILE_SIZE + 2, 2, TILE_SIZE - 4, TILE_SIZE - 4)
        }
      })
      const enemyTexture = this.textures.get('enemies')
      for (let index = 0; index < 6; index++) {
        enemyTexture.add(index * 4, 0, index * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE)
      }
    }

    if (!this.textures.exists('enemy-bullets')) {
      this.drawToCanvasTexture('enemy-bullets', 24, 8, (ctx) => {
        const colors = ['#ffd700', '#e94560', '#ff6b6b']
        for (let index = 0; index < 3; index++) {
          ctx.fillStyle = colors[index]
          ctx.beginPath()
          ctx.arc(index * 8 + 4, 4, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      const bulletTexture = this.textures.get('enemy-bullets')
      for (let index = 0; index < 3; index++) {
        bulletTexture.add(index * 2, 0, index * 8, 0, 8, 8)
      }
    }
  }

  private createAnimations() {
    this.anims.create({
      key: 'hero-idle',
      frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    })
    this.anims.create({
      key: 'hero-run',
      frames: [4, 9, 11, 14, 11, 9].map((frame) => ({
        key: 'hero',
        frame,
      })),
      frameRate: 9,
      repeat: -1,
    })
    this.anims.create({
      key: 'hero-jump',
      frames: this.anims.generateFrameNumbers('hero', { start: 16, end: 17 }),
      frameRate: 4,
      repeat: -1,
    })
    this.anims.create({
      key: 'hero-attack',
      frames: this.anims.generateFrameNumbers('hero', { start: 18, end: 19 }),
      frameRate: 8,
    })
    this.anims.create({ key: 'hero-hurt', frames: [{ key: 'hero', frame: 20 }], frameRate: 1 })
    this.anims.create({
      key: 'hero-charge',
      frames: this.anims.generateFrameNumbers('hero', { start: 21, end: 23 }),
      frameRate: 8,
      repeat: -1,
    })
    this.createPlayerAnimations('dragon-player', 'dragon-player')
    this.anims.create({
      key: 'dragon-claw-scratch-anim',
      frames: this.anims.generateFrameNumbers('dragon-claw-scratch', { start: 0, end: 4 }),
      frameRate: 28,
    })

    const enemyTypes = ['book', 'phone', 'invitation', 'camera', 'cap', 'thesis-paper']
    enemyTypes.forEach((type, row) => {
      this.anims.create({
        key: `enemy-${type}-idle`,
        frames: this.anims.generateFrameNumbers('enemies', { start: row * 4, end: row * 4 + 3 }),
        frameRate: 5,
        repeat: -1,
      })
    })

    const bossTypes = ['train', 'piano', 'thesis'] as const
    bossTypes.forEach((type) => {
      this.anims.create({
        key: `boss-${type}-idle`,
        frames: this.anims.generateFrameNumbers(`boss-${type}`, { start: 0, end: 1 }),
        frameRate: 3,
        repeat: -1,
      })
      this.anims.create({
        key: `boss-${type}-attack`,
        frames: this.anims.generateFrameNumbers(`boss-${type}`, { start: 2, end: 3 }),
        frameRate: 5,
        repeat: 1,
      })
    })

    this.anims.create({
      key: 'dragon-idle',
      frames: this.anims.generateFrameNumbers('dragon', { start: 0, end: 2 }),
      frameRate: 3,
      repeat: -1,
    })
    this.anims.create({
      key: 'dragon-celebrate',
      frames: this.anims.generateFrameNumbers('dragon', { start: 1, end: 3 }),
      frameRate: 4,
      repeat: -1,
    })

    for (let frame = 0; frame < 16; frame += 2) {
      this.anims.create({
        key: `enemy-bullet-${frame}`,
        frames: this.anims.generateFrameNumbers('enemy-bullets', { start: frame, end: frame + 1 }),
        frameRate: 8,
        repeat: -1,
      })
    }

    ;[
      ['item-heart', 0, 1],
      ['item-coin', 2, 3],
      ['item-powerup', 4, 5],
      ['item-star', 6, 7],
      ['item-powerup-dragon', 8, 9],
    ].forEach(([key, start, end]) => {
      this.anims.create({
        key: key as string,
        frames: this.anims.generateFrameNumbers('item-pickups', { start: start as number, end: end as number }),
        frameRate: 5,
        repeat: -1,
      })
    })
  }

  private createPlayerAnimations(textureKey: string, prefix: string) {
    this.anims.create({
      key: `${prefix}-idle`,
      frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    })
    this.anims.create({
      key: `${prefix}-run`,
      frames:
        prefix === 'dragon-player'
          ? [13, 14, 12, 10, 8, 9, 10, 12].map((frame) => ({ key: textureKey, frame }))
          : this.anims.generateFrameNumbers(textureKey, { start: 4, end: 15 }),
      frameRate: prefix === 'dragon-player' ? 9 : 10,
      repeat: -1,
    })
    this.anims.create({
      key: `${prefix}-jump`,
      frames: this.anims.generateFrameNumbers(textureKey, { start: 16, end: 17 }),
      frameRate: 4,
      repeat: -1,
    })
    this.anims.create({
      key: `${prefix}-attack`,
      frames:
        prefix === 'dragon-player'
          ? [18, 19, 18].map((frame) => ({ key: textureKey, frame }))
          : this.anims.generateFrameNumbers(textureKey, { start: 18, end: 19 }),
      frameRate: prefix === 'dragon-player' ? 18 : 8,
    })
    this.anims.create({ key: `${prefix}-hurt`, frames: [{ key: textureKey, frame: 20 }], frameRate: 1 })
    this.anims.create({
      key: `${prefix}-charge`,
      frames: this.anims.generateFrameNumbers(textureKey, { start: 21, end: 23 }),
      frameRate: 8,
      repeat: -1,
    })
  }
}
