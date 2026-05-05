import Phaser from 'phaser'

import {
  getSelectedDifficultyId,
  setSelectedDifficulty,
  type DifficultyId,
} from '../../content/difficulty'
import { getGameModeContent } from '../../content/gameContent'
import { STAGES } from '../../content/stages'
import type { GameModeId, StorySequenceId } from '../../../types/site'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants'
import {
  resetSelectedPlayerCharacter,
  setSelectedPlayerCharacter,
} from '../systems/PlayerSelection'
import { progressStorage } from '../systems/ProgressStorage'
import { isHitboxDebugEnabled, toggleHitboxDebug } from '../systems/DebugMode'
import { runState } from '../systems/RunState'
import { scoreManager } from '../systems/ScoreManager'

type HiddenCodeInput = 'left' | 'right'
type FadableGameObject = Phaser.GameObjects.GameObject & {
  setAlpha: (value?: number, topRight?: number, bottomLeft?: number, bottomRight?: number) => FadableGameObject
}

const HIDDEN_CODE: HiddenCodeInput[] = [
  'right',
  'right',
  'right',
  'left',
  'left',
  'left',
  'right',
  'right',
  'right',
  'right',
  'right',
  'right',
  'right',
]
const CUTSCENE_CODE = 'kaist11'
const DEBUG_OPTIONS_CODE = 'dgist15'
const STAGE_SKIP_CODES: Record<string, number> = {
  dgist2: 1,
  dgist3: 2,
}
const MAX_DEBUG_CODE_LENGTH = Math.max(
  CUTSCENE_CODE.length,
  DEBUG_OPTIONS_CODE.length,
  ...Object.keys(STAGE_SKIP_CODES).map((code) => code.length),
)
const CUTSCENE_SEQUENCE_OPTIONS: Array<{ id: StorySequenceId; label: string }> = [
  { id: 'intro', label: 'INTRO' },
  { id: 'afterStage1', label: 'AFTER STAGE 1' },
  { id: 'afterStage2', label: 'AFTER STAGE 2' },
  { id: 'ending', label: 'ENDING' },
]
const MODE_TRANSITION_STRIPE_COUNT = 14
const MODE_TRANSITION_STRIPE_DURATION = 120
const MODE_TRANSITION_STRIPE_STAGGER = 13
const DIFFICULTY_OPTIONS: DifficultyId[] = ['easy', 'hard']
const TITLE_ACTION_X = GAME_WIDTH - 118

type TitleModeStyle = {
  backgroundKey: string
  logoKey: string
  overlayAlpha: number
  subtitleColor: string
  accentColor: string
  accentNumber: number
  logoWidth: number
  logoY: number
  subtitleY: number
}

const TITLE_MODE_STYLES: Record<GameModeId, TitleModeStyle> = {
  bride: {
    backgroundKey: 'title-bg-bride',
    logoKey: 'title-logo-bride',
    overlayAlpha: 0.08,
    subtitleColor: '#ffe1f1',
    accentColor: '#ffd76d',
    accentNumber: 0xffd76d,
    logoWidth: 372,
    logoY: 112,
    subtitleY: 190,
  },
  dragon: {
    backgroundKey: 'title-bg-dragon',
    logoKey: 'title-logo-dragon',
    overlayAlpha: 0.08,
    subtitleColor: '#bdf7ff',
    accentColor: '#8ff4ff',
    accentNumber: 0x8ff4ff,
    logoWidth: 382,
    logoY: 108,
    subtitleY: 194,
  },
}
const TITLE_SPARKLES: [number, number, number][] = [
  [66, 79, 4],
  [88, 151, 2],
  [339, 84, 3],
  [360, 155, 4],
  [322, 505, 2],
]

export class TitleScene extends Phaser.Scene {
  private hiddenCodeIndex = 0
  private debugCodeBuffer = ''
  private dragonSelected = false
  private started = false
  private modeTransitioning = false

  constructor() {
    super({ key: 'TitleScene' })
  }

  create() {
    resetSelectedPlayerCharacter()
    this.hiddenCodeIndex = 0
    this.debugCodeBuffer = ''
    this.dragonSelected = false
    this.started = false
    this.modeTransitioning = false

    const getModeId = (): GameModeId => (this.dragonSelected ? 'dragon' : 'bride')
    const getDisplaySizeByWidth = (key: string, width: number) => {
      const image = this.textures.get(key).getSourceImage() as HTMLImageElement
      return {
        width,
        height: image.height * (width / image.width),
      }
    }
    let modeContent = getGameModeContent('bride')
    let modeStyle = TITLE_MODE_STYLES.bride
    let difficultyPanel: Phaser.GameObjects.Container | null = null
    let difficultyPanelSelectedIndex = getSelectedDifficultyId() === 'hard' ? 1 : 0
    let stageSelectPanel: Phaser.GameObjects.Container | null = null
    let stageSelectStageIndex = 0
    let stageSelectDifficultyId = getSelectedDifficultyId()
    let stageSelectSelectedIndex = 0
    let cutsceneSelectPanel: Phaser.GameObjects.Container | null = null
    let cutsceneSelectSequenceIndex = 0
    let cutsceneSelectSelectedIndex = 1
    const titleBg = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, modeStyle.backgroundKey)
      .setOrigin(0.5)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
    const vignette = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050716, modeStyle.overlayAlpha)
      .setDepth(9)
    const transitionStripes = Array.from({ length: MODE_TRANSITION_STRIPE_COUNT }, (_, index) => {
      const stripeHeight = Math.ceil(GAME_HEIGHT / MODE_TRANSITION_STRIPE_COUNT)
      return this.add
        .rectangle(
          0,
          index * stripeHeight + stripeHeight / 2,
          GAME_WIDTH,
          stripeHeight + 1,
          0x050716,
          1,
        )
        .setAlpha(0)
        .setOrigin(0, 0.5)
        .setScale(0, 1)
        .setDepth(10)
    })
    const titleSparkles = this.add.graphics().setDepth(13)
    const titleText = this.add.text(-1000, -1000, modeContent.title, {
      fontFamily: 'monospace',
      fontSize: '1px',
      color: '#ffffff',
    })
    titleText.setVisible(false)
    const titleLogoSize = getDisplaySizeByWidth(modeStyle.logoKey, modeStyle.logoWidth)
    const titleLogo = this.add
      .image(GAME_WIDTH / 2, modeStyle.logoY, modeStyle.logoKey)
      .setOrigin(0.5)
      .setDisplaySize(titleLogoSize.width, titleLogoSize.height)
      .setDepth(14)
    const subtitleText = this.add
      .text(GAME_WIDTH / 2, modeStyle.subtitleY, modeContent.subtitle, {
        fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
        fontSize: '14px',
        color: modeStyle.subtitleColor,
        fontStyle: 'bold',
        stroke: '#111827',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(14)

    const startText = this.add
      .text(TITLE_ACTION_X, 548, modeContent.startLabel, {
        fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
        fontSize: '20px',
        color: modeStyle.accentColor,
        fontStyle: 'bold',
        stroke: '#0c1020',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(14)

    const startPulseTween = this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0.55 },
      scale: { from: 1, to: 1.035 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    })

    let mobileStartText: Phaser.GameObjects.Text | null = null
    const getContentObjects = (): FadableGameObject[] =>
      ([
        titleLogo,
        subtitleText,
        startText,
        titleSparkles,
        mobileStartText,
      ].filter(Boolean) as FadableGameObject[])

    const runStripeWipe = (phase: 'cover' | 'reveal', onComplete: () => void) => {
      transitionStripes.forEach((stripe, index) => {
        stripe
          .setAlpha(1)
          .setOrigin(phase === 'cover' ? 0 : 1, 0.5)
          .setX(phase === 'cover' ? 0 : GAME_WIDTH)
          .setScale(phase === 'cover' ? 0 : 1, 1)

        this.tweens.add({
          targets: stripe,
          scaleX: phase === 'cover' ? 1 : 0,
          duration: MODE_TRANSITION_STRIPE_DURATION,
          delay: index * MODE_TRANSITION_STRIPE_STAGGER,
          ease: phase === 'cover' ? 'Quad.easeOut' : 'Quad.easeIn',
          onComplete: () => {
            if (phase === 'reveal') {
              stripe.setAlpha(0)
            }
          },
        })
      })

      this.time.delayedCall(
        MODE_TRANSITION_STRIPE_DURATION +
          MODE_TRANSITION_STRIPE_STAGGER * (transitionStripes.length - 1) +
          20,
        onComplete,
      )
    }

    const drawModeDecorations = () => {
      titleSparkles.clear()
      titleSparkles.fillStyle(modeStyle.accentNumber, 0.95)
      TITLE_SPARKLES.forEach(([x, y, radius]) => {
        titleSparkles.fillCircle(x, y, radius)
        titleSparkles.fillCircle(x + radius * 1.8, y, Math.max(1, radius - 2))
        titleSparkles.fillCircle(x - radius * 1.8, y, Math.max(1, radius - 2))
        titleSparkles.fillCircle(x, y + radius * 1.8, Math.max(1, radius - 2))
        titleSparkles.fillCircle(x, y - radius * 1.8, Math.max(1, radius - 2))
      })
    }
    drawModeDecorations()

    this.events.on('update', () => {
      titleBg.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2)
      titleLogo.setPosition(GAME_WIDTH / 2, modeStyle.logoY)
    })

    const applyModeContent = () => {
      const modeId = getModeId()
      modeContent = getGameModeContent(modeId)
      modeStyle = TITLE_MODE_STYLES[modeId]
      titleBg.setTexture(modeStyle.backgroundKey)
      titleBg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      titleLogo.setTexture(modeStyle.logoKey)
      titleLogo.setPosition(GAME_WIDTH / 2, modeStyle.logoY)
      const logoSize = getDisplaySizeByWidth(modeStyle.logoKey, modeStyle.logoWidth)
      titleLogo.setDisplaySize(logoSize.width, logoSize.height)
      vignette.setFillStyle(0x050716, modeStyle.overlayAlpha)
      drawModeDecorations()
      titleText.setText(modeContent.title)
      subtitleText.setText(modeContent.subtitle)
      subtitleText.setY(modeStyle.subtitleY)
      subtitleText.setColor(modeStyle.subtitleColor)
      startText.setText(modeContent.startLabel)
      startText.setColor(modeStyle.accentColor)
      mobileStartText?.setText(modeContent.startLabel)
    }

    const switchTitleMode = (nextMode: GameModeId) => {
      if (this.modeTransitioning) return
      this.modeTransitioning = true
      this.hiddenCodeIndex = 0
      startPulseTween.pause()
      const contentObjects = getContentObjects()
      this.tweens.add({
        targets: contentObjects,
        alpha: 0,
        duration: 80,
        ease: 'Quad.easeOut',
      })

      runStripeWipe('cover', () => {
        this.dragonSelected = nextMode === 'dragon'
        setSelectedPlayerCharacter(nextMode)
        applyModeContent()
        getContentObjects().forEach((object) => object.setAlpha(0))

        runStripeWipe('reveal', () => {
          this.tweens.add({
            targets: getContentObjects(),
            alpha: 1,
            duration: 120,
            ease: 'Quad.easeOut',
            onComplete: () => {
              startPulseTween.resume()
              this.modeTransitioning = false
            },
          })
        })
      })
    }

    const recordCodeInput = (input: HiddenCodeInput) => {
      if (this.modeTransitioning) return
      if (input === HIDDEN_CODE[this.hiddenCodeIndex]) {
        this.hiddenCodeIndex++
      } else {
        this.hiddenCodeIndex = input === HIDDEN_CODE[0] ? 1 : 0
      }
      if (this.hiddenCodeIndex >= HIDDEN_CODE.length) {
        switchTitleMode(this.dragonSelected ? 'bride' : 'dragon')
      }
    }

    const closeDifficultyPanel = () => {
      difficultyPanel?.destroy(true)
      difficultyPanel = null
      startText.setVisible(true)
      mobileStartText?.setVisible(true)
    }

    const closeStageSelectPanel = () => {
      stageSelectPanel?.destroy(true)
      stageSelectPanel = null
    }

    const closeCutsceneSelectPanel = () => {
      cutsceneSelectPanel?.destroy(true)
      cutsceneSelectPanel = null
    }

    const startStageDirectly = (stageIndex: number, difficultyId: DifficultyId) => {
      if (this.started || this.modeTransitioning) return
      this.started = true
      setSelectedDifficulty(difficultyId)
      scoreManager.reset()
      runState.reset()
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('StageScene', { stageIndex })
      })
    }

    const startCutsceneDirectly = (sequenceId: StorySequenceId) => {
      if (this.started || this.modeTransitioning) return
      this.started = true
      scoreManager.reset()
      runState.reset()
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('StoryScene', {
          sequenceId,
          nextScene: 'TitleScene',
        })
      })
    }

    const startIntroWithDifficulty = (difficultyId: DifficultyId) => {
      if (this.started || this.modeTransitioning) return
      this.started = true
      setSelectedDifficulty(difficultyId)
      progressStorage.recordAttempt(getModeId(), difficultyId)
      closeDifficultyPanel()
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('StoryScene', {
          sequenceId: 'intro',
          nextScene: 'StageScene',
          nextData: { stageIndex: 0 },
        })
      })
    }

    const createPanelShell = (title: string, height: number) => {
      const container = this.add.container(0, 0).setDepth(120)
      const overlay = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050716, 0.62)
        .setInteractive()
      const panel = this.add.graphics()
      const panelX = 60
      const panelY = (GAME_HEIGHT - height) / 2
      panel.fillStyle(0x101827, 0.95)
      panel.fillRoundedRect(panelX, panelY, GAME_WIDTH - panelX * 2, height, 8)
      panel.lineStyle(2, modeStyle.accentNumber, 0.78)
      panel.strokeRoundedRect(panelX, panelY, GAME_WIDTH - panelX * 2, height, 8)
      const titleText = this.add
        .text(GAME_WIDTH / 2, panelY + 42, title, {
          fontFamily: 'monospace',
          fontSize: '21px',
          color: modeStyle.accentColor,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setStroke('#050716', 4)
      container.add([overlay, panel, titleText])
      return { container, panelY }
    }

    const showDifficultyPanel = (preserveSelection = false) => {
      if (this.started || this.modeTransitioning) return
      const shouldResetSelection = !difficultyPanel && !preserveSelection
      closeStageSelectPanel()
      closeCutsceneSelectPanel()
      closeDifficultyPanel()
      if (shouldResetSelection) {
        difficultyPanelSelectedIndex = getSelectedDifficultyId() === 'hard' ? 1 : 0
      }
      startText.setVisible(false)
      mobileStartText?.setVisible(false)
      const container = this.add.container(0, 0).setDepth(120)
      difficultyPanel = container
      const texts: Phaser.GameObjects.Text[] = []

      const updateSelection = () => {
        DIFFICULTY_OPTIONS.forEach((id, index) => {
          const selected = index === difficultyPanelSelectedIndex
          texts[index].setText(selected ? `< ${id.toUpperCase()} >` : id.toUpperCase())
          texts[index].setColor(selected ? modeStyle.accentColor : '#e0e0e0')
          texts[index].setAlpha(selected ? 1 : 0.68)
          texts[index].setScale(selected ? 1.08 : 1)
        })
      }

      DIFFICULTY_OPTIONS.forEach((id, index) => {
        const text = this.add
          .text(TITLE_ACTION_X, 520 + index * 50, '', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#e0e0e0',
            fontStyle: 'bold',
            align: 'center',
          })
          .setOrigin(0.5)
          .setStroke('#0c1020', 6)
          .setInteractive({ useHandCursor: true })
        const activate = () => {
          difficultyPanelSelectedIndex = index
          updateSelection()
          startIntroWithDifficulty(id)
        }
        text.on('pointerover', () => {
          difficultyPanelSelectedIndex = index
          updateSelection()
        })
        text.on('pointerdown', activate)
        texts.push(text)
        container.add(text)
      })
      updateSelection()
    }

    const showStageSelectPanel = (stageIndex: number, replaceOpenPanel = false) => {
      if (this.started || this.modeTransitioning) return
      if (stageSelectPanel && stageSelectStageIndex === stageIndex && !replaceOpenPanel) {
        closeStageSelectPanel()
        return
      }
      const shouldResetSelection = !stageSelectPanel || !replaceOpenPanel
      closeDifficultyPanel()
      closeCutsceneSelectPanel()
      closeStageSelectPanel()
      stageSelectStageIndex = stageIndex
      if (shouldResetSelection) {
        stageSelectDifficultyId = getSelectedDifficultyId()
        stageSelectSelectedIndex = stageIndex
      }
      const { container, panelY } = createPanelShell('디버그 옵션', 378)
      stageSelectPanel = container
      const rows: Phaser.GameObjects.Text[] = []
      const backs: Phaser.GameObjects.Rectangle[] = []

      const getRowLabel = (index: number) => {
        if (index < STAGES.length) return `STAGE ${index + 1}: ${STAGES[index].name}`
        if (index === 3) return `EASY ${stageSelectDifficultyId === 'easy' ? 'ON' : 'OFF'}`
        if (index === 4) return `HARD ${stageSelectDifficultyId === 'hard' ? 'ON' : 'OFF'}`
        if (index === 5) return `HITBOX ${isHitboxDebugEnabled() ? 'ON' : 'OFF'}`
        return 'START'
      }

      const updateSelection = () => {
        rows.forEach((text, index) => {
          const selected = index === stageSelectSelectedIndex
          const activeStage = index < STAGES.length && index === stageSelectStageIndex
          const activeDifficulty =
            (index === 3 && stageSelectDifficultyId === 'easy') ||
            (index === 4 && stageSelectDifficultyId === 'hard')
          const active = activeStage || activeDifficulty || (index === 5 && isHitboxDebugEnabled())
          text.setText(`${selected ? '> ' : '  '}${getRowLabel(index)}`)
          text.setColor(selected || active ? modeStyle.accentColor : '#e0e0e0')
          text.setAlpha(selected || active ? 1 : 0.72)
          backs[index].setFillStyle(selected ? 0x25344f : active ? 0x1d3246 : 0x172033, selected ? 0.96 : 0.86)
          backs[index].setStrokeStyle(1, selected || active ? modeStyle.accentNumber : 0xffffff, selected ? 0.78 : 0.2)
        })
      }

      const activateRow = (index: number) => {
        stageSelectSelectedIndex = index
        if (index < STAGES.length) stageSelectStageIndex = index
        else if (index === 3) stageSelectDifficultyId = 'easy'
        else if (index === 4) stageSelectDifficultyId = 'hard'
        else if (index === 5) toggleHitboxDebug()
        else startStageDirectly(stageSelectStageIndex, stageSelectDifficultyId)
        updateSelection()
      }

      for (let index = 0; index < 7; index++) {
        const y = panelY + 94 + index * 38
        const back = this.add
          .rectangle(GAME_WIDTH / 2, y, 270, 31, 0x172033, 0.88)
          .setStrokeStyle(1, 0xffffff, 0.2)
          .setInteractive({ useHandCursor: true })
        const text = this.add
          .text(GAME_WIDTH / 2, y, '', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#e0e0e0',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
        back.on('pointerover', () => {
          stageSelectSelectedIndex = index
          updateSelection()
        })
        text.on('pointerover', () => {
          stageSelectSelectedIndex = index
          updateSelection()
        })
        back.on('pointerdown', () => activateRow(index))
        text.on('pointerdown', () => activateRow(index))
        backs.push(back)
        rows.push(text)
        container.add([back, text])
      }
      updateSelection()
    }

    const showCutsceneSelectPanel = (replaceOpenPanel = false) => {
      if (this.started || this.modeTransitioning) return
      const shouldResetSelection = !cutsceneSelectPanel || !replaceOpenPanel
      closeDifficultyPanel()
      closeStageSelectPanel()
      closeCutsceneSelectPanel()
      if (shouldResetSelection) {
        cutsceneSelectSequenceIndex = 0
        cutsceneSelectSelectedIndex = 1
      }
      const { container, panelY } = createPanelShell('컷씬 조회', 340)
      cutsceneSelectPanel = container
      const rows: Phaser.GameObjects.Text[] = []
      const backs: Phaser.GameObjects.Rectangle[] = []

      const getRowLabel = (index: number) => {
        if (index === 0) return `MODE ${getModeId().toUpperCase()}`
        if (index >= 1 && index <= CUTSCENE_SEQUENCE_OPTIONS.length) {
          return CUTSCENE_SEQUENCE_OPTIONS[index - 1].label
        }
        return 'START'
      }

      const updateSelection = () => {
        rows.forEach((text, index) => {
          const selected = index === cutsceneSelectSelectedIndex
          const activeCutscene = index >= 1 && index - 1 === cutsceneSelectSequenceIndex
          const active = index === 0 || activeCutscene
          text.setText(`${selected ? '> ' : '  '}${getRowLabel(index)}`)
          text.setColor(selected || active ? modeStyle.accentColor : '#e0e0e0')
          text.setAlpha(selected || active ? 1 : 0.72)
          backs[index].setFillStyle(selected ? 0x25344f : active ? 0x1d3246 : 0x172033, selected ? 0.96 : 0.86)
          backs[index].setStrokeStyle(1, selected || active ? modeStyle.accentNumber : 0xffffff, selected ? 0.78 : 0.2)
        })
      }

      const activateRow = (index: number) => {
        cutsceneSelectSelectedIndex = index
        if (index === 0) {
          this.dragonSelected = !this.dragonSelected
          setSelectedPlayerCharacter(getModeId())
          applyModeContent()
        } else if (index >= 1 && index <= CUTSCENE_SEQUENCE_OPTIONS.length) {
          cutsceneSelectSequenceIndex = index - 1
        } else {
          startCutsceneDirectly(CUTSCENE_SEQUENCE_OPTIONS[cutsceneSelectSequenceIndex].id)
          return
        }
        updateSelection()
      }

      for (let index = 0; index < 6; index++) {
        const y = panelY + 94 + index * 38
        const back = this.add
          .rectangle(GAME_WIDTH / 2, y, 270, 31, 0x172033, 0.88)
          .setStrokeStyle(1, 0xffffff, 0.2)
          .setInteractive({ useHandCursor: true })
        const text = this.add
          .text(GAME_WIDTH / 2, y, '', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#e0e0e0',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
        back.on('pointerover', () => {
          cutsceneSelectSelectedIndex = index
          updateSelection()
        })
        text.on('pointerover', () => {
          cutsceneSelectSelectedIndex = index
          updateSelection()
        })
        back.on('pointerdown', () => activateRow(index))
        text.on('pointerdown', () => activateRow(index))
        backs.push(back)
        rows.push(text)
        container.add([back, text])
      }
      updateSelection()
    }

    const handleDifficultyPanelKey = (event: KeyboardEvent) => {
      if (!difficultyPanel) return false
      if (event.repeat) return true
      if (event.code === 'Escape') {
        closeDifficultyPanel()
        return true
      }
      if (
        event.code === 'ArrowUp' ||
        event.code === 'ArrowDown' ||
        event.code === 'ArrowLeft' ||
        event.code === 'ArrowRight'
      ) {
        difficultyPanelSelectedIndex = difficultyPanelSelectedIndex === 0 ? 1 : 0
        difficultyPanel.destroy(true)
        difficultyPanel = null
        showDifficultyPanel(true)
        return true
      }
      if (event.code === 'KeyE') {
        startIntroWithDifficulty('easy')
        return true
      }
      if (event.code === 'KeyH') {
        startIntroWithDifficulty('hard')
        return true
      }
      if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyZ' || event.code === 'KeyX') {
        startIntroWithDifficulty(difficultyPanelSelectedIndex === 0 ? 'easy' : 'hard')
        return true
      }
      return true
    }

    const handleStageSelectPanelKey = (event: KeyboardEvent) => {
      if (!stageSelectPanel) return false
      if (event.repeat) return true
      if (event.code === 'Escape') {
        closeStageSelectPanel()
        return true
      }
      if (event.code === 'ArrowUp') {
        stageSelectSelectedIndex = Phaser.Math.Wrap(stageSelectSelectedIndex - 1, 0, 7)
        showStageSelectPanel(stageSelectStageIndex, true)
        return true
      }
      if (event.code === 'ArrowDown') {
        stageSelectSelectedIndex = Phaser.Math.Wrap(stageSelectSelectedIndex + 1, 0, 7)
        showStageSelectPanel(stageSelectStageIndex, true)
        return true
      }
      if (event.code === 'Digit1' || event.code === 'Digit2' || event.code === 'Digit3') {
        stageSelectStageIndex = Number(event.code.replace('Digit', '')) - 1
        showStageSelectPanel(stageSelectStageIndex, true)
        return true
      }
      if (event.code === 'KeyE') {
        stageSelectDifficultyId = 'easy'
        showStageSelectPanel(stageSelectStageIndex, true)
        return true
      }
      if (event.code === 'KeyH') {
        stageSelectDifficultyId = 'hard'
        showStageSelectPanel(stageSelectStageIndex, true)
        return true
      }
      if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyZ' || event.code === 'KeyX') {
        if (stageSelectSelectedIndex < STAGES.length) stageSelectStageIndex = stageSelectSelectedIndex
        else if (stageSelectSelectedIndex === 3) stageSelectDifficultyId = 'easy'
        else if (stageSelectSelectedIndex === 4) stageSelectDifficultyId = 'hard'
        else if (stageSelectSelectedIndex === 5) toggleHitboxDebug()
        else {
          startStageDirectly(stageSelectStageIndex, stageSelectDifficultyId)
          return true
        }
        showStageSelectPanel(stageSelectStageIndex, true)
        return true
      }
      return false
    }

    const handleCutsceneSelectPanelKey = (event: KeyboardEvent) => {
      if (!cutsceneSelectPanel) return false
      if (event.repeat) return true
      if (event.code === 'Escape') {
        closeCutsceneSelectPanel()
        return true
      }
      if (event.code === 'ArrowUp') {
        cutsceneSelectSelectedIndex = Phaser.Math.Wrap(cutsceneSelectSelectedIndex - 1, 0, 6)
        showCutsceneSelectPanel(true)
        return true
      }
      if (event.code === 'ArrowDown') {
        cutsceneSelectSelectedIndex = Phaser.Math.Wrap(cutsceneSelectSelectedIndex + 1, 0, 6)
        showCutsceneSelectPanel(true)
        return true
      }
      if (event.code === 'KeyM') {
        cutsceneSelectSelectedIndex = 0
        this.dragonSelected = !this.dragonSelected
        setSelectedPlayerCharacter(getModeId())
        applyModeContent()
        showCutsceneSelectPanel(true)
        return true
      }
      if (event.code.startsWith('Digit')) {
        const digit = Number(event.code.replace('Digit', ''))
        if (digit >= 1 && digit <= CUTSCENE_SEQUENCE_OPTIONS.length) {
          cutsceneSelectSequenceIndex = digit - 1
          cutsceneSelectSelectedIndex = digit
          showCutsceneSelectPanel(true)
          return true
        }
      }
      if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyZ' || event.code === 'KeyX') {
        if (cutsceneSelectSelectedIndex === 0) {
          this.dragonSelected = !this.dragonSelected
          setSelectedPlayerCharacter(getModeId())
          applyModeContent()
          showCutsceneSelectPanel(true)
        } else if (cutsceneSelectSelectedIndex >= 1 && cutsceneSelectSelectedIndex <= CUTSCENE_SEQUENCE_OPTIONS.length) {
          cutsceneSelectSequenceIndex = cutsceneSelectSelectedIndex - 1
          showCutsceneSelectPanel(true)
        } else {
          startCutsceneDirectly(CUTSCENE_SEQUENCE_OPTIONS[cutsceneSelectSequenceIndex].id)
        }
        return true
      }
      return false
    }

    const recordDebugCodeInput = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (!/^[a-z0-9]$/.test(key)) return

      this.debugCodeBuffer = `${this.debugCodeBuffer}${key}`.slice(-MAX_DEBUG_CODE_LENGTH)
      if (this.debugCodeBuffer.endsWith(DEBUG_OPTIONS_CODE)) {
        this.debugCodeBuffer = ''
        showStageSelectPanel(0)
        return
      }
      if (this.debugCodeBuffer.endsWith(CUTSCENE_CODE)) {
        this.debugCodeBuffer = ''
        showCutsceneSelectPanel()
        return
      }
      for (const [code, stageIndex] of Object.entries(STAGE_SKIP_CODES)) {
        if (!this.debugCodeBuffer.endsWith(code)) continue
        this.debugCodeBuffer = ''
        showStageSelectPanel(stageIndex)
        return
      }
    }

    const start = () => {
      showDifficultyPanel()
    }

    startText.on('pointerdown', start)
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (handleDifficultyPanelKey(event)) return
      if (handleStageSelectPanelKey(event)) return
      if (handleCutsceneSelectPanelKey(event)) return
      recordDebugCodeInput(event)
      if (event.code === 'ArrowLeft') {
        recordCodeInput('left')
        return
      }
      if (event.code === 'ArrowRight') {
        recordCodeInput('right')
        return
      }
      if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyZ' || event.code === 'KeyX') {
        if (event.repeat) return
        start()
      }
    })

    if (!this.sys.game.device.os.desktop) {
      mobileStartText = this.createMobileTitleControls(recordCodeInput, start, modeContent.startLabel)
    }

    this.cameras.main.fadeIn(500, 0, 0, 0)
  }

  private createMobileTitleControls(
    recordCodeInput: (input: HiddenCodeInput) => void,
    start: () => void,
    startLabel: string,
  ) {
    const y = GAME_HEIGHT - 54
    let startButtonText: Phaser.GameObjects.Text | null = null
    const makeButton = (x: number, width: number, label: string, onDown: () => void) => {
      const rect = this.add
        .rectangle(x, y, width, 44, 0x000000, 0.34)
        .setStrokeStyle(1, 0xffffff, 0.18)
        .setInteractive({ useHandCursor: true })
      const text = this.add
        .text(x, y, label, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
      rect.on('pointerdown', () => {
        this.tweens.add({ targets: [rect, text], alpha: { from: 0.65, to: 1 }, duration: 90, yoyo: true })
        onDown()
      })
      return text
    }

    makeButton(52, 80, '◀', () => recordCodeInput('left'))
    makeButton(148, 80, '▶', () => recordCodeInput('right'))
    startButtonText = makeButton(300, 152, startLabel, start)
    return startButtonText
  }
}
