import Phaser from 'phaser'

import { getSelectedDifficultyId, type DifficultyId } from '../../content/difficulty'
import { getGameModeContent } from '../../content/gameContent'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants'
import { getSelectedPlayerCharacter } from '../systems/PlayerSelection'
import { progressStorage } from '../systems/ProgressStorage'
import { runState } from '../systems/RunState'
import { CURRENT_STAGE_RESTART_SCORE_PENALTY, scoreManager } from '../systems/ScoreManager'

const MIN_GAME_OVER_INPUT_DELAY = 700
const HERO_FRAME_HEIGHT = 224
const DRAGON_FRAME_HEIGHT = 195
const GAME_OVER_TARGET_CHARACTER_HEIGHT = 184
const GAME_OVER_HERO_SCALE = GAME_OVER_TARGET_CHARACTER_HEIGHT / HERO_FRAME_HEIGHT
const GAME_OVER_DRAGON_SCALE = GAME_OVER_TARGET_CHARACTER_HEIGHT / DRAGON_FRAME_HEIGHT

type GameOverAction = 'retry-full' | 'retry-stage' | 'title'

interface GameOverOption {
  action: GameOverAction
  label: string
  y: number
}

export class GameOverScene extends Phaser.Scene {
  private gameOverInputReady = false
  private transitioning = false
  private selectedOption = 0
  private optionTexts: Phaser.GameObjects.Text[] = []
  private options: GameOverOption[] = []
  private stageIndex = 0
  private difficultyId: DifficultyId = 'easy'

  constructor() {
    super({ key: 'GameOverScene' })
  }

  init(data: { stageIndex?: number }) {
    this.gameOverInputReady = false
    this.transitioning = false
    this.selectedOption = 0
    this.optionTexts = []
    this.options = []
    this.stageIndex = data.stageIndex ?? 0
    this.difficultyId = getSelectedDifficultyId()
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

    this.options = this.createOptions()
    this.optionTexts = this.options.map((option, index) => {
      const text = this.add
      .text(GAME_WIDTH / 2, option.y, option.label, {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#e0e0e0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

      text.on('pointerover', () => selectOption(index))
      text.on('pointerdown', () => {
        selectOption(index)
        activateSelectedOption()
      })
      return text
    })
    this.updateSelectedOption()

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.82, modeContent.retry.subtitle, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#888',
      })
      .setOrigin(0.5)

    const transitionTo = (
      sceneKey: 'StoryScene' | 'StageScene' | 'TitleScene',
      sceneData: Record<string, unknown> | undefined,
      prepare: () => void,
    ) => {
      if (!this.gameOverInputReady || this.transitioning) return
      this.transitioning = true
      prepare()

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
      }, () => {
        runState.reset()
        scoreManager.reset()
      })
    }

    const retryCurrentStage = () => {
      if (!this.gameOverInputReady || this.transitioning) return
      progressStorage.recordAttempt(getSelectedPlayerCharacter(), getSelectedDifficultyId())
      transitionTo('StageScene', { stageIndex: this.stageIndex }, () => {
        scoreManager.penalizePercent(CURRENT_STAGE_RESTART_SCORE_PENALTY)
        runState.reset()
      })
    }

    const backToTitle = () => {
      transitionTo('TitleScene', undefined, () => {
        runState.reset()
        scoreManager.reset()
      })
    }

    const selectOption = (index: number) => {
      this.selectedOption = index
      this.updateSelectedOption()
    }
    const activateSelectedOption = () => {
      const action = this.options[this.selectedOption]?.action
      if (action === 'retry-full') retry()
      else if (action === 'retry-stage') retryCurrentStage()
      else backToTitle()
    }

    this.time.delayedCall(MIN_GAME_OVER_INPUT_DELAY, () => {
      this.gameOverInputReady = true
      this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (!this.gameOverInputReady || this.transitioning) return
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
          const direction = event.code === 'ArrowUp' ? -1 : 1
          this.selectedOption = Phaser.Math.Wrap(this.selectedOption + direction, 0, this.options.length)
          this.updateSelectedOption()
          return
        }
        if (event.code === 'Enter' || event.code === 'Space') {
          activateSelectedOption()
        }
      })
    })
  }

  private createOptions(): GameOverOption[] {
    const content = getGameModeContent()
    if (this.difficultyId !== 'easy') {
      return [
        { action: 'retry-full', label: content.retry.title, y: GAME_HEIGHT * 0.66 },
        { action: 'title', label: content.retry.backToTitle, y: GAME_HEIGHT * 0.72 },
      ]
    }

    return [
      { action: 'retry-full', label: '처음부터 다시 시작하기', y: GAME_HEIGHT * 0.64 },
      { action: 'retry-stage', label: '해당 스테이지부터 다시 시작하기', y: GAME_HEIGHT * 0.7 },
      { action: 'title', label: content.retry.backToTitle, y: GAME_HEIGHT * 0.76 },
    ]
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
    const label = this.options[index]?.label ?? ''
    return label.replace(/^▶\s*/, '')
  }
}
