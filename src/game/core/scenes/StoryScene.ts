import Phaser from 'phaser'

import {
  getGameModeContent,
  getStoryImageKey,
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

    if (isBlackout) {
      this.slideObjects.push(
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1),
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
      // Temporarily skip the photo mosaic credits until those images are ready to publish.
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
