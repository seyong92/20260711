import Phaser from 'phaser'

import { getSelectedDifficultyId } from '../../content/difficulty'
import { getGameModeContent } from '../../content/gameContent'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants'
import { getSelectedPlayerCharacter } from '../systems/PlayerSelection'
import { progressStorage } from '../systems/ProgressStorage'
import { runState } from '../systems/RunState'
import { scoreManager } from '../systems/ScoreManager'

const MIN_GAME_OVER_INPUT_DELAY = 700
const HERO_FRAME_HEIGHT = 224
const DRAGON_FRAME_HEIGHT = 195
const GAME_OVER_TARGET_CHARACTER_HEIGHT = 184
const GAME_OVER_HERO_SCALE = GAME_OVER_TARGET_CHARACTER_HEIGHT / HERO_FRAME_HEIGHT
const GAME_OVER_DRAGON_SCALE = GAME_OVER_TARGET_CHARACTER_HEIGHT / DRAGON_FRAME_HEIGHT

export class GameOverScene extends Phaser.Scene {
  private gameOverInputReady = false
  private transitioning = false
  private selectedOption = 0
  private optionTexts: Phaser.GameObjects.Text[] = []

  constructor() {
    super({ key: 'GameOverScene' })
  }

  init() {
    this.gameOverInputReady = false
    this.transitioning = false
    this.selectedOption = 0
    this.optionTexts = []
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0)
    this.add.image(0, 0, 'game-over-bg').setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050716, 0.4)
    const character = getSelectedPlayerCharacter()
    const modeContent = getGameModeContent(character)
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, modeContent.uiLabels.gameOverTitle, {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#e94560',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
    const characterSprite = this.add
      .sprite(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, character === 'dragon' ? 'dragon-player' : 'hero', 20)
    characterSprite.setScale(character === 'dragon' ? GAME_OVER_DRAGON_SCALE : GAME_OVER_HERO_SCALE)

    const retryText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.66, modeContent.retry.title, {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#e0e0e0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    const titleText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, modeContent.retry.backToTitle, {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#e0e0e0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    this.optionTexts = [retryText, titleText]
    this.updateSelectedOption()

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.82, modeContent.retry.subtitle, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#888',
      })
      .setOrigin(0.5)

    const transitionTo = (sceneKey: 'StoryScene' | 'TitleScene', sceneData?: Record<string, unknown>) => {
      if (!this.gameOverInputReady || this.transitioning) return
      this.transitioning = true
      runState.reset()
      scoreManager.reset()

      let hasStarted = false
      const startScene = () => {
        if (hasStarted) return
        hasStarted = true
        this.scene.start(sceneKey, sceneData)
      }

      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', startScene)
      this.time.delayedCall(420, startScene)
    }

    const retry = () => {
      if (!this.gameOverInputReady || this.transitioning) return
      progressStorage.recordAttempt(getSelectedPlayerCharacter(), getSelectedDifficultyId())
      transitionTo('StoryScene', {
        sequenceId: 'intro',
        nextScene: 'StageScene',
        nextData: { stageIndex: 0 },
      })
    }

    const backToTitle = () => {
      transitionTo('TitleScene')
    }

    const selectOption = (index: number) => {
      this.selectedOption = index
      this.updateSelectedOption()
    }
    const activateSelectedOption = () => {
      if (this.selectedOption === 0) retry()
      else backToTitle()
    }

    retryText.on('pointerover', () => selectOption(0))
    titleText.on('pointerover', () => selectOption(1))
    retryText.on('pointerdown', () => {
      selectOption(0)
      activateSelectedOption()
    })
    titleText.on('pointerdown', () => {
      selectOption(1)
      activateSelectedOption()
    })
    this.time.delayedCall(MIN_GAME_OVER_INPUT_DELAY, () => {
      this.gameOverInputReady = true
      this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (!this.gameOverInputReady || this.transitioning) return
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
          this.selectedOption = this.selectedOption === 0 ? 1 : 0
          this.updateSelectedOption()
          return
        }
        if (event.code === 'Enter' || event.code === 'Space') {
          activateSelectedOption()
        }
      })
    })
  }

  private updateSelectedOption() {
    this.optionTexts.forEach((text, index) => {
      const selected = index === this.selectedOption
      const label = this.getOptionLabel(index)
      text.setText(`${selected ? '▶ ' : '  '}${label}`)
      text.setColor(selected ? '#ffd700' : '#e0e0e0')
      text.setAlpha(selected ? 1 : 0.68)
    })
  }

  private getOptionLabel(index: number) {
    const label = index === 0 ? getGameModeContent().retry.title : getGameModeContent().retry.backToTitle
    return label.replace(/^▶\s*/, '')
  }
}
