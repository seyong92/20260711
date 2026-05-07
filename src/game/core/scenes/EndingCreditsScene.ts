import Phaser from 'phaser'

import {
  ENDING_CREDITS,
  getEndingCreditImageKey,
} from '../../content/endingCredits'
import { getSelectedDifficultyId } from '../../content/difficulty'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants'
import { getSelectedPlayerCharacter } from '../systems/PlayerSelection'
import { scoreManager } from '../systems/ScoreManager'

const SLIDE_DURATION_MS = 5200
const PIXEL_HOLD_MS = 1300
const MOSAIC_OUT_MS = 900
const MOSAIC_IN_MS = 900
const FAST_FORWARD_SCALE = 3
const SKIP_HOLD_MS = 1200
const PIXEL_BLOCK_SIZE = 7
const MAX_MOSAIC_BLOCK_SIZE = 58
const IMAGE_AREA = {
  x: 24,
  y: 48,
  width: GAME_WIDTH - 48,
  height: GAME_HEIGHT - 238,
}

export class EndingCreditsScene extends Phaser.Scene {
  private currentIndex = 0
  private slideElapsedMs = 0
  private finished = false
  private pressedKeys = new Set<string>()
  private touchFastForward = false
  private touchSkipHeld = false
  private skipHoldMs = 0
  private pixelTexture: Phaser.Textures.CanvasTexture | null = null
  private revealTexture: Phaser.Textures.CanvasTexture | null = null
  private pixelImage: Phaser.GameObjects.Image | null = null
  private revealImage: Phaser.GameObjects.Image | null = null
  private photoImage: Phaser.GameObjects.Image | null = null
  private captionText: Phaser.GameObjects.Text | null = null
  private counterText: Phaser.GameObjects.Text | null = null
  private skipProgress: Phaser.GameObjects.Rectangle | null = null
  private lastPixelBlock = -1
  private lastRevealBlock = -1

  constructor() {
    super({ key: 'EndingCreditsScene' })
  }

  create() {
    this.resetState()
    this.cameras.main.fadeIn(450, 0, 0, 0)
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1)

    this.pixelTexture = this.createCanvasTexture('ending-credit-pixel-frame')
    this.revealTexture = this.createCanvasTexture('ending-credit-reveal-frame')
    this.pixelImage = this.add.image(0, 0, 'ending-credit-pixel-frame').setOrigin(0, 0).setDepth(2)
    this.revealImage = this.add.image(0, 0, 'ending-credit-reveal-frame').setOrigin(0, 0).setDepth(3)
    this.photoImage = this.add
      .image(GAME_WIDTH / 2, IMAGE_AREA.y + IMAGE_AREA.height / 2, getEndingCreditImageKey(0))
      .setDepth(4)

    this.add
      .text(GAME_WIDTH / 2, 24, 'ENDING CREDITS', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#c9b46d',
      })
      .setOrigin(0.5)
      .setDepth(8)

    this.captionText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 126, '', {
        fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
        fontSize: '16px',
        color: '#fff8e8',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: GAME_WIDTH - 58 },
      })
      .setOrigin(0.5)
      .setDepth(8)
      .setStroke('#000000', 5)

    this.counterText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 72, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#8f8f8f',
      })
      .setOrigin(0.5)
      .setDepth(8)

    if (!this.shouldShowTouchControls()) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 36, 'ANY KEY: FAST-FORWARD   SPACE HOLD: SKIP', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#7f7f7f',
        })
        .setOrigin(0.5)
        .setDepth(8)
    }

    this.createTouchButtons()
    this.showSlide(0)
    this.input.keyboard?.on('keydown', this.onKeyDown, this)
    this.input.keyboard?.on('keyup', this.onKeyUp, this)
    this.game.events.once('restart-game', this.restartFromScoreOverlay, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this)
  }

  update(_time: number, delta: number) {
    if (this.finished) return

    const skipHeld = this.pressedKeys.has('Space') || this.touchSkipHeld
    if (skipHeld) {
      this.skipHoldMs += delta
      this.updateSkipProgress()
      if (this.skipHoldMs >= SKIP_HOLD_MS) {
        this.finishCredits()
        return
      }
    } else if (this.skipHoldMs > 0) {
      this.skipHoldMs = 0
      this.updateSkipProgress()
    }

    const speed = this.isFastForwarding() ? FAST_FORWARD_SCALE : 1
    this.slideElapsedMs += delta * speed
    while (this.slideElapsedMs >= SLIDE_DURATION_MS && !this.finished) {
      this.slideElapsedMs -= SLIDE_DURATION_MS
      const nextIndex = this.currentIndex + 1
      if (nextIndex >= ENDING_CREDITS.length) {
        this.finishCredits()
        return
      }
      this.showSlide(nextIndex)
    }

    this.updateSlideVisuals()
  }

  private resetState() {
    this.currentIndex = 0
    this.slideElapsedMs = 0
    this.finished = false
    this.pressedKeys.clear()
    this.touchFastForward = false
    this.touchSkipHeld = false
    this.skipHoldMs = 0
    this.lastPixelBlock = -1
    this.lastRevealBlock = -1
  }

  private showSlide(index: number) {
    this.currentIndex = index
    this.slideElapsedMs = 0
    this.lastPixelBlock = -1
    this.lastRevealBlock = -1
    const entry = ENDING_CREDITS[index]
    const imageKey = getEndingCreditImageKey(index)
    this.setContainedPhoto(this.photoImage, imageKey)
    this.photoImage?.setAlpha(0)
    this.captionText?.setText(entry.caption)
    this.counterText?.setText(`${index + 1} / ${ENDING_CREDITS.length}`)
    this.drawMosaicTexture(this.pixelTexture, imageKey, PIXEL_BLOCK_SIZE)
    this.drawMosaicTexture(this.revealTexture, imageKey, MAX_MOSAIC_BLOCK_SIZE)
    this.updateSlideVisuals()
  }

  private updateSlideVisuals() {
    const elapsed = this.slideElapsedMs
    if (elapsed < PIXEL_HOLD_MS) {
      this.setPixelFrame(PIXEL_BLOCK_SIZE)
      this.pixelImage?.setAlpha(1)
      this.revealImage?.setAlpha(0)
      this.photoImage?.setAlpha(0)
      return
    }

    if (elapsed < PIXEL_HOLD_MS + MOSAIC_OUT_MS) {
      const progress = (elapsed - PIXEL_HOLD_MS) / MOSAIC_OUT_MS
      const blockSize = Phaser.Math.Linear(PIXEL_BLOCK_SIZE, MAX_MOSAIC_BLOCK_SIZE, progress)
      this.setPixelFrame(blockSize)
      this.pixelImage?.setAlpha(1 - progress)
      this.revealImage?.setAlpha(0)
      this.photoImage?.setAlpha(0)
      return
    }

    if (elapsed < PIXEL_HOLD_MS + MOSAIC_OUT_MS + MOSAIC_IN_MS) {
      const progress = (elapsed - PIXEL_HOLD_MS - MOSAIC_OUT_MS) / MOSAIC_IN_MS
      const blockSize = Phaser.Math.Linear(MAX_MOSAIC_BLOCK_SIZE, 2, progress)
      this.setRevealFrame(blockSize)
      this.pixelImage?.setAlpha(0)
      this.revealImage?.setAlpha(1 - Math.max(0, progress - 0.82) / 0.18)
      this.photoImage?.setAlpha(progress)
      return
    }

    this.pixelImage?.setAlpha(0)
    this.revealImage?.setAlpha(0)
    this.photoImage?.setAlpha(1)
  }

  private setPixelFrame(blockSize: number) {
    const roundedBlock = Math.round(blockSize)
    if (roundedBlock === this.lastPixelBlock) return
    this.lastPixelBlock = roundedBlock
    this.drawMosaicTexture(this.pixelTexture, getEndingCreditImageKey(this.currentIndex), roundedBlock)
  }

  private setRevealFrame(blockSize: number) {
    const roundedBlock = Math.round(blockSize)
    if (roundedBlock === this.lastRevealBlock) return
    this.lastRevealBlock = roundedBlock
    this.drawMosaicTexture(this.revealTexture, getEndingCreditImageKey(this.currentIndex), roundedBlock)
  }

  private createCanvasTexture(key: string) {
    if (this.textures.exists(key)) {
      this.textures.remove(key)
    }
    const texture = this.textures.createCanvas(key, GAME_WIDTH, GAME_HEIGHT)
    if (!texture) {
      throw new Error(`Failed to create ending credit canvas texture: ${key}`)
    }
    return texture
  }

  private drawMosaicTexture(
    texture: Phaser.Textures.CanvasTexture | null,
    imageKey: string,
    blockSize: number,
  ) {
    if (!texture) return
    const sourceImage = this.textures.get(imageKey).getSourceImage() as CanvasImageSource & {
      width: number
      height: number
    }
    const rect = this.getContainedRect(sourceImage.width, sourceImage.height)
    const canvas = texture.getCanvas()
    const ctx = texture.getContext()
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    const lowWidth = Math.max(1, Math.ceil(rect.width / blockSize))
    const lowHeight = Math.max(1, Math.ceil(rect.height / blockSize))
    const buffer = document.createElement('canvas')
    buffer.width = lowWidth
    buffer.height = lowHeight
    const bufferCtx = buffer.getContext('2d')
    if (!bufferCtx) return

    bufferCtx.imageSmoothingEnabled = true
    bufferCtx.drawImage(sourceImage, 0, 0, lowWidth, lowHeight)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(buffer, rect.x, rect.y, rect.width, rect.height)
    ctx.imageSmoothingEnabled = true
    texture.refresh()
    canvas.style.imageRendering = 'pixelated'
  }

  private setContainedPhoto(image: Phaser.GameObjects.Image | null, imageKey: string) {
    if (!image) return
    const source = this.textures.get(imageKey).getSourceImage() as { width: number; height: number }
    const rect = this.getContainedRect(source.width, source.height)
    image.setTexture(imageKey)
    image.setPosition(rect.x + rect.width / 2, rect.y + rect.height / 2)
    image.setDisplaySize(rect.width, rect.height)
  }

  private getContainedRect(sourceWidth: number, sourceHeight: number) {
    const scale = Math.min(IMAGE_AREA.width / sourceWidth, IMAGE_AREA.height / sourceHeight)
    const width = sourceWidth * scale
    const height = sourceHeight * scale
    return {
      x: IMAGE_AREA.x + (IMAGE_AREA.width - width) / 2,
      y: IMAGE_AREA.y + (IMAGE_AREA.height - height) / 2,
      width,
      height,
    }
  }

  private createTouchButtons() {
    if (!this.shouldShowTouchControls()) return

    const fastButton = this.createControlButton(GAME_WIDTH / 2 - 78, GAME_HEIGHT - 32, '빨리감기')
    const skipButton = this.createControlButton(GAME_WIDTH / 2 + 78, GAME_HEIGHT - 32, '스킵')
    this.skipProgress = this.add
      .rectangle(skipButton.x - 54, skipButton.y + 19, 0, 3, 0xffd76d, 0.9)
      .setOrigin(0, 0.5)
      .setDepth(12)

    fastButton.on('pointerdown', () => {
      this.touchFastForward = true
    })
    fastButton.on('pointerup', () => {
      this.touchFastForward = false
    })
    fastButton.on('pointerout', () => {
      this.touchFastForward = false
    })
    skipButton.on('pointerdown', () => {
      this.touchSkipHeld = true
    })
    skipButton.on('pointerup', () => {
      this.touchSkipHeld = false
    })
    skipButton.on('pointerout', () => {
      this.touchSkipHeld = false
    })
  }

  private createControlButton(x: number, y: number, label: string) {
    const container = this.add.container(x, y).setDepth(11)
    const bg = this.add
      .rectangle(0, 0, 126, 38, 0x141414, 0.84)
      .setStrokeStyle(1, 0xc9b46d, 0.72)
      .setInteractive({ useHandCursor: true })
    const text = this.add
      .text(0, 0, label, {
        fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
        fontSize: '13px',
        color: '#fff8e8',
      })
      .setOrigin(0.5)
    container.add([bg, text])
    container.setSize(126, 38)
    container.setInteractive(
      new Phaser.Geom.Rectangle(-63, -19, 126, 38),
      Phaser.Geom.Rectangle.Contains,
    )
    return container
  }

  private shouldShowTouchControls() {
    return !this.sys.game.device.os.desktop || this.scale.displaySize.width <= 540
  }

  private updateSkipProgress() {
    if (!this.skipProgress) return
    const progress = Phaser.Math.Clamp(this.skipHoldMs / SKIP_HOLD_MS, 0, 1)
    this.skipProgress.width = 108 * progress
  }

  private onKeyDown(event: KeyboardEvent) {
    this.pressedKeys.add(event.code)
    if (event.code === 'Space') {
      event.preventDefault()
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    this.pressedKeys.delete(event.code)
    if (event.code === 'Space') {
      event.preventDefault()
    }
  }

  private isFastForwarding() {
    return this.pressedKeys.size > 0 || this.touchFastForward
  }

  private finishCredits() {
    if (this.finished) return
    this.finished = true
    this.cleanup()
    const character = getSelectedPlayerCharacter()
    scoreManager.addClearBonus()
    this.game.events.emit('game-ended', {
      score: scoreManager.getScore(),
      playTime: scoreManager.getPlayTime(),
      character,
      difficulty: getSelectedDifficultyId(),
    })
  }

  private cleanup() {
    this.input.keyboard?.off('keydown', this.onKeyDown, this)
    this.input.keyboard?.off('keyup', this.onKeyUp, this)
    this.pressedKeys.clear()
    this.touchFastForward = false
    this.touchSkipHeld = false
  }

  private shutdown() {
    this.game.events.off('restart-game', this.restartFromScoreOverlay, this)
    this.cleanup()
  }

  private restartFromScoreOverlay() {
    this.shutdown()
    this.scene.start('TitleScene')
  }
}
