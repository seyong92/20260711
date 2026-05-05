import Phaser from 'phaser'

import {
  getGameModeContent,
  getStoryImageKey,
  getStoryRevealImageKey,
} from '../../content/gameContent'
import type { StorySequenceId } from '../../../types/site'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants'
import { getSelectedPlayerCharacter } from '../systems/PlayerSelection'
import { runState } from '../systems/RunState'
import { scoreManager } from '../systems/ScoreManager'

const INTRO_INPUT_LOCK_MS = 350
const TRANSITION_INPUT_LOCK_MS = 700
const TYPEWRITER_INTERVAL_MS = 34
const CAPTION_PANEL_HEIGHT = 170
const MOSAIC_PIXEL_TO_BLOCK_MS = 720
const MOSAIC_OUT_MS = 650
const MOSAIC_IN_MS = 850
const MOSAIC_TOTAL_MS = MOSAIC_PIXEL_TO_BLOCK_MS + MOSAIC_OUT_MS + MOSAIC_IN_MS
const MOSAIC_PIXEL_BLOCK_SIZE = 2
const MOSAIC_MAX_BLOCK_SIZE = 58

interface StorySceneData {
  sequenceId: StorySequenceId
  nextScene?: string
  nextData?: Record<string, unknown>
  completeRun?: boolean
}

export class StoryScene extends Phaser.Scene {
  private sequenceId: StorySequenceId = 'intro'
  private nextScene?: string
  private nextData?: Record<string, unknown>
  private completeRun = false
  private currentSlideIndex = 0
  private inputReadyAt = 0
  private transitioning = false
  private slideObjects: Phaser.GameObjects.GameObject[] = []
  private captionText: Phaser.GameObjects.Text | null = null
  private captionChars: string[] = []
  private captionCharIndex = 0
  private captionTimer: Phaser.Time.TimerEvent | null = null
  private mosaicElapsedMs = 0
  private mosaicPixelTexture: Phaser.Textures.CanvasTexture | null = null
  private mosaicRevealTexture: Phaser.Textures.CanvasTexture | null = null
  private mosaicBaseImage: Phaser.GameObjects.Image | null = null
  private mosaicPixelImage: Phaser.GameObjects.Image | null = null
  private mosaicRevealImage: Phaser.GameObjects.Image | null = null
  private mosaicPhotoImage: Phaser.GameObjects.Image | null = null
  private mosaicRevealStarted = false
  private mosaicPixelImageKey = ''
  private mosaicRevealImageKey = ''
  private lastPixelBlock = -1
  private lastPixelBlend = -1
  private lastRevealBlock = -1

  constructor() {
    super({ key: 'StoryScene' })
  }

  init(data: StorySceneData) {
    this.sequenceId = data.sequenceId
    this.nextScene = data.nextScene
    this.nextData = data.nextData
    this.completeRun = data.completeRun ?? false
    this.currentSlideIndex = 0
    this.inputReadyAt = 0
    this.transitioning = false
    this.slideObjects = []
    this.captionText = null
    this.captionChars = []
    this.captionCharIndex = 0
    this.captionTimer = null
    this.resetMosaicState()
  }

  create() {
    if (this.sequenceId === 'intro') {
      scoreManager.reset()
      runState.reset()
    }

    this.cameras.main.fadeIn(350, 0, 0, 0)
    this.showSlide(0)
    this.input.on('pointerdown', this.tryAdvance, this)
    this.input.keyboard?.on('keydown', this.onKeyDown, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)
  }

  private showSlide(index: number) {
    this.clearSlideObjects()
    this.currentSlideIndex = index
    this.inputReadyAt = this.time.now + this.getInputLockMs()
    const character = getSelectedPlayerCharacter()
    const modeContent = getGameModeContent(character)
    const slide = modeContent.storySequences[this.sequenceId][index]
    const isBlackout = slide.variant === 'blackout'
    const isMosaicReveal = slide.variant === 'mosaicReveal' && !!slide.revealFileName

    if (isBlackout) {
      this.slideObjects.push(
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1),
      )
    } else if (isMosaicReveal) {
      this.createMosaicRevealSlide(
        getStoryImageKey(character, this.sequenceId, index),
        getStoryRevealImageKey(character, this.sequenceId, index),
      )
    } else if (slide.fileName) {
      const imageKey = getStoryImageKey(character, this.sequenceId, index)
      this.slideObjects.push(
        this.add.image(0, 0, imageKey).setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT),
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050716, 0.08),
      )
    }

    this.slideObjects.push(...this.createCaptionLayer(slide.caption, isBlackout))
  }

  update(_time: number, delta: number) {
    if (!this.mosaicRevealStarted || !this.mosaicPhotoImage || this.transitioning) return
    this.mosaicElapsedMs += delta
    this.updateMosaicVisuals()
  }

  private createCaptionLayer(caption: string, isBlackout: boolean) {
    const panelY = GAME_HEIGHT - CAPTION_PANEL_HEIGHT / 2
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, panelY, GAME_WIDTH, CAPTION_PANEL_HEIGHT, 0x050716, isBlackout ? 0 : 0.72)
      .setOrigin(0.5)
      .setDepth(10)

    const topLine = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - CAPTION_PANEL_HEIGHT, GAME_WIDTH, 1, 0xffffff, isBlackout ? 0 : 0.18)
      .setOrigin(0.5)
      .setDepth(11)

    const captionText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 118, '', {
        fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
        fontSize: '16px',
        color: '#fff8e8',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: GAME_WIDTH - 56 },
      })
      .setOrigin(0.5)
      .setDepth(12)
      .setStroke('#120815', 4)
    this.captionText = captionText
    this.startCaptionTypewriter(caption)

    const hintText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 26, 'Z / X / TAP', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffd76d',
      })
      .setOrigin(0.5)
      .setDepth(12)

    this.tweens.add({
      targets: hintText,
      alpha: { from: 0.35, to: 1 },
      duration: 560,
      yoyo: true,
      repeat: -1,
    })

    return [panel, topLine, captionText, hintText]
  }

  private onKeyDown(event: KeyboardEvent) {
    if (!['KeyZ', 'KeyX'].includes(event.code)) return
    this.tryAdvance()
  }

  private tryAdvance() {
    if (this.transitioning || this.time.now < this.inputReadyAt) return
    if (!this.isCaptionComplete()) {
      this.completeCaption()
      return
    }
    if (this.isMosaicRevealActive()) {
      if (!this.mosaicRevealStarted) {
        this.startMosaicReveal()
        return
      }
      if (!this.isMosaicRevealComplete()) return
    }

    const character = getSelectedPlayerCharacter()
    const slides = getGameModeContent(character).storySequences[this.sequenceId]
    const nextIndex = this.currentSlideIndex + 1

    this.transitioning = true
    this.cameras.main.fadeOut(250, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (nextIndex < slides.length) {
        this.transitioning = false
        this.showSlide(nextIndex)
        this.cameras.main.fadeIn(250, 0, 0, 0)
        return
      }

      this.finishSequence()
    })
  }

  private finishSequence() {
    this.cleanup()
    if (this.completeRun) {
      this.scene.start('VictoryScene')
      return
    }

    if (this.nextScene) {
      this.scene.start(this.nextScene, this.nextData)
    }
  }

  private clearSlideObjects() {
    this.stopCaptionTimer()
    this.captionText = null
    this.captionChars = []
    this.captionCharIndex = 0
    this.slideObjects.forEach((object) => object.destroy())
    this.slideObjects = []
    this.resetMosaicState()
  }

  private createMosaicRevealSlide(pixelImageKey: string, revealImageKey: string) {
    this.mosaicElapsedMs = 0
    this.mosaicPixelImageKey = pixelImageKey
    this.mosaicRevealImageKey = revealImageKey
    this.mosaicRevealStarted = false
    this.lastPixelBlock = -1
    this.lastPixelBlend = -1
    this.lastRevealBlock = -1
    this.mosaicPixelTexture = this.createCanvasTexture('story-mosaic-pixel-frame')
    this.mosaicRevealTexture = this.createCanvasTexture('story-mosaic-reveal-frame')
    this.mosaicBaseImage = this.add
      .image(0, 0, pixelImageKey)
      .setOrigin(0, 0)
      .setDepth(2)
    this.mosaicPixelImage = this.add
      .image(0, 0, 'story-mosaic-pixel-frame')
      .setOrigin(0, 0)
      .setDepth(3)
      .setAlpha(0)
    this.mosaicRevealImage = this.add
      .image(0, 0, 'story-mosaic-reveal-frame')
      .setOrigin(0, 0)
      .setDepth(4)
      .setAlpha(0)
    this.mosaicPhotoImage = this.add
      .image(0, 0, revealImageKey)
      .setOrigin(0, 0)
      .setDepth(5)
      .setAlpha(0)
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050716, 0.08)
      .setDepth(6)

    this.slideObjects.push(
      this.mosaicBaseImage,
      this.mosaicPixelImage,
      this.mosaicRevealImage,
      this.mosaicPhotoImage,
      overlay,
    )
    this.drawInterpolatedMosaicTexture(
      this.mosaicPixelTexture,
      pixelImageKey,
      revealImageKey,
      MOSAIC_PIXEL_BLOCK_SIZE,
      0,
    )
    this.drawMosaicTexture(this.mosaicRevealTexture, revealImageKey, MOSAIC_MAX_BLOCK_SIZE)
  }

  private startMosaicReveal() {
    this.mosaicRevealStarted = true
    this.mosaicElapsedMs = 0
    this.inputReadyAt = this.time.now + MOSAIC_TOTAL_MS
    this.updateMosaicVisuals()
  }

  private updateMosaicVisuals() {
    const elapsed = this.mosaicElapsedMs
    if (elapsed < MOSAIC_PIXEL_TO_BLOCK_MS) {
      const progress = elapsed / MOSAIC_PIXEL_TO_BLOCK_MS
      const blockSize = Phaser.Math.Linear(MOSAIC_PIXEL_BLOCK_SIZE, MOSAIC_MAX_BLOCK_SIZE, progress)
      this.setMosaicPixelFrame(blockSize, progress)
      this.mosaicBaseImage?.setAlpha(1 - progress)
      this.mosaicPixelImage?.setAlpha(progress)
      this.mosaicRevealImage?.setAlpha(0)
      this.mosaicPhotoImage?.setAlpha(0)
      return
    }

    if (elapsed < MOSAIC_PIXEL_TO_BLOCK_MS + MOSAIC_OUT_MS) {
      this.setMosaicPixelFrame(MOSAIC_MAX_BLOCK_SIZE, 1)
      this.mosaicBaseImage?.setAlpha(0)
      this.mosaicPixelImage?.setAlpha(1)
      this.mosaicRevealImage?.setAlpha(0)
      this.mosaicPhotoImage?.setAlpha(0)
      return
    }

    if (elapsed < MOSAIC_TOTAL_MS) {
      const progress = (elapsed - MOSAIC_PIXEL_TO_BLOCK_MS - MOSAIC_OUT_MS) / MOSAIC_IN_MS
      const blockSize = Phaser.Math.Linear(MOSAIC_MAX_BLOCK_SIZE, 2, progress)
      this.setMosaicRevealFrame(blockSize)
      this.mosaicBaseImage?.setAlpha(0)
      this.mosaicPixelImage?.setAlpha(0)
      this.mosaicRevealImage?.setAlpha(1 - Math.max(0, progress - 0.82) / 0.18)
      this.mosaicPhotoImage?.setAlpha(progress)
      return
    }

    this.mosaicBaseImage?.setAlpha(0)
    this.mosaicPixelImage?.setAlpha(0)
    this.mosaicRevealImage?.setAlpha(0)
    this.mosaicPhotoImage?.setAlpha(1)
  }

  private setMosaicPixelFrame(blockSize: number, blend: number) {
    const roundedBlock = Math.round(blockSize)
    const roundedBlend = Math.round(Phaser.Math.Clamp(blend, 0, 1) * 100)
    if (roundedBlock === this.lastPixelBlock && roundedBlend === this.lastPixelBlend) return
    this.lastPixelBlock = roundedBlock
    this.lastPixelBlend = roundedBlend
    this.drawInterpolatedMosaicTexture(
      this.mosaicPixelTexture,
      this.mosaicPixelImageKey,
      this.mosaicRevealImageKey,
      roundedBlock,
      roundedBlend / 100,
    )
  }

  private setMosaicRevealFrame(blockSize: number) {
    const roundedBlock = Math.round(blockSize)
    if (roundedBlock === this.lastRevealBlock) return
    this.lastRevealBlock = roundedBlock
    this.drawMosaicTexture(this.mosaicRevealTexture, this.mosaicRevealImageKey, roundedBlock)
  }

  private createCanvasTexture(key: string) {
    if (this.textures.exists(key)) {
      this.textures.remove(key)
    }
    const texture = this.textures.createCanvas(key, GAME_WIDTH, GAME_HEIGHT)
    if (!texture) {
      throw new Error(`Failed to create story mosaic canvas texture: ${key}`)
    }
    return texture
  }

  private drawMosaicTexture(
    texture: Phaser.Textures.CanvasTexture | null,
    imageKey: string,
    blockSize: number,
  ) {
    if (!texture || !imageKey) return
    const sourceImage = this.textures.get(imageKey).getSourceImage() as CanvasImageSource
    const canvas = texture.getCanvas()
    const ctx = texture.getContext()
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    const lowWidth = Math.max(1, Math.ceil(GAME_WIDTH / blockSize))
    const lowHeight = Math.max(1, Math.ceil(GAME_HEIGHT / blockSize))
    const buffer = document.createElement('canvas')
    buffer.width = lowWidth
    buffer.height = lowHeight
    const bufferCtx = buffer.getContext('2d')
    if (!bufferCtx) return

    bufferCtx.imageSmoothingEnabled = true
    bufferCtx.drawImage(sourceImage, 0, 0, lowWidth, lowHeight)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(buffer, 0, 0, GAME_WIDTH, GAME_HEIGHT)
    ctx.imageSmoothingEnabled = true
    texture.refresh()
    canvas.style.imageRendering = 'pixelated'
  }

  private drawInterpolatedMosaicTexture(
    texture: Phaser.Textures.CanvasTexture | null,
    pixelImageKey: string,
    revealImageKey: string,
    blockSize: number,
    blend: number,
  ) {
    if (!texture || !pixelImageKey || !revealImageKey) return
    const pixelImage = this.textures.get(pixelImageKey).getSourceImage() as CanvasImageSource
    const revealImage = this.textures.get(revealImageKey).getSourceImage() as CanvasImageSource
    const canvas = texture.getCanvas()
    const ctx = texture.getContext()
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    const lowWidth = Math.max(1, Math.ceil(GAME_WIDTH / blockSize))
    const lowHeight = Math.max(1, Math.ceil(GAME_HEIGHT / blockSize))
    const buffer = document.createElement('canvas')
    buffer.width = lowWidth
    buffer.height = lowHeight
    const bufferCtx = buffer.getContext('2d')
    if (!bufferCtx) return

    bufferCtx.imageSmoothingEnabled = true
    bufferCtx.drawImage(pixelImage, 0, 0, lowWidth, lowHeight)
    bufferCtx.globalAlpha = Phaser.Math.Clamp(blend, 0, 1)
    bufferCtx.drawImage(revealImage, 0, 0, lowWidth, lowHeight)
    bufferCtx.globalAlpha = 1

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(buffer, 0, 0, GAME_WIDTH, GAME_HEIGHT)
    ctx.imageSmoothingEnabled = true
    texture.refresh()
    canvas.style.imageRendering = 'pixelated'
  }

  private isMosaicRevealActive() {
    return !!this.mosaicPhotoImage
  }

  private isMosaicRevealComplete() {
    return this.mosaicElapsedMs >= MOSAIC_TOTAL_MS
  }

  private resetMosaicState() {
    this.mosaicElapsedMs = 0
    this.mosaicPixelTexture = null
    this.mosaicRevealTexture = null
    this.mosaicBaseImage = null
    this.mosaicPixelImage = null
    this.mosaicRevealImage = null
    this.mosaicPhotoImage = null
    this.mosaicRevealStarted = false
    this.mosaicPixelImageKey = ''
    this.mosaicRevealImageKey = ''
    this.lastPixelBlock = -1
    this.lastPixelBlend = -1
    this.lastRevealBlock = -1
  }

  private getInputLockMs() {
    return this.sequenceId === 'intro' ? INTRO_INPUT_LOCK_MS : TRANSITION_INPUT_LOCK_MS
  }

  private startCaptionTypewriter(caption: string) {
    this.stopCaptionTimer()
    this.captionChars = Array.from(caption)
    this.captionCharIndex = 0
    this.captionText?.setText('')
    this.captionTimer = this.time.addEvent({
      delay: TYPEWRITER_INTERVAL_MS,
      loop: true,
      callback: () => this.revealNextCaptionCharacter(),
    })
  }

  private revealNextCaptionCharacter() {
    if (!this.captionText) return
    this.captionCharIndex = Math.min(this.captionCharIndex + 1, this.captionChars.length)
    this.captionText.setText(this.captionChars.slice(0, this.captionCharIndex).join(''))
    if (this.isCaptionComplete()) {
      this.stopCaptionTimer()
    }
  }

  private isCaptionComplete() {
    return this.captionCharIndex >= this.captionChars.length
  }

  private completeCaption() {
    this.captionCharIndex = this.captionChars.length
    this.captionText?.setText(this.captionChars.join(''))
    this.stopCaptionTimer()
  }

  private stopCaptionTimer() {
    this.captionTimer?.remove(false)
    this.captionTimer = null
  }

  private cleanup() {
    this.input.off('pointerdown', this.tryAdvance, this)
    this.input.keyboard?.off('keydown', this.onKeyDown, this)
    this.clearSlideObjects()
  }
}
