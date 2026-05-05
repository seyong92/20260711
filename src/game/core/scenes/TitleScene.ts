import Phaser from 'phaser'

import {
  getSelectedDifficultyId,
  setSelectedDifficulty,
  type DifficultyId,
} from '../../content/difficulty'
import { ACHIEVEMENTS } from '../../content/achievements'
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
const HIDDEN_CODE_HINT_TEXT = '→ → →  ← ← ←  → → → → → → → 을 눌러보세요'
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
const DIFFICULTY_OPTIONS: DifficultyId[] = ['easy', 'normal', 'hard']
const DEFAULT_DIFFICULTY_ID: DifficultyId = 'normal'
const STAGE_SELECT_DIFFICULTY_START_INDEX = 3
const STAGE_SELECT_HITBOX_INDEX = STAGE_SELECT_DIFFICULTY_START_INDEX + DIFFICULTY_OPTIONS.length
const STAGE_SELECT_START_INDEX = STAGE_SELECT_HITBOX_INDEX + 1
const STAGE_SELECT_ROW_COUNT = STAGE_SELECT_START_INDEX + 1
const TITLE_ACTION_X = GAME_WIDTH - 118
const TITLE_MENU_OPTIONS = ['게임 시작', '도전 과제'] as const

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
]

function getDifficultyOptionIndex(id: DifficultyId) {
  const index = DIFFICULTY_OPTIONS.indexOf(id)
  return index >= 0 ? index : DIFFICULTY_OPTIONS.indexOf(DEFAULT_DIFFICULTY_ID)
}

function hasBrideGameClear() {
  const snapshot = progressStorage.getSnapshot()
  return DIFFICULTY_OPTIONS.some((difficulty) => snapshot.modes.bride[difficulty].stageClears[2] > 0)
}

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
    let mainMenuSelectedIndex = 0
    let difficultyPanel: Phaser.GameObjects.Container | null = null
    let achievementsPanel: Phaser.GameObjects.Container | null = null
    let achievementsContent: Phaser.GameObjects.Container | null = null
    let achievementsScrollThumb: Phaser.GameObjects.Rectangle | null = null
    let achievementsScrollY = 0
    let achievementsMinScrollY = 0
    let difficultyPanelSelectedIndex = getDifficultyOptionIndex(getSelectedDifficultyId())
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
      .text(TITLE_ACTION_X, 520, '', {
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

    const achievementsText = this.add
      .text(TITLE_ACTION_X, 566, '', {
        fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
        fontSize: '18px',
        color: '#e0e0e0',
        fontStyle: 'bold',
        stroke: '#0c1020',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(14)

    const dragonHintText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.5, HIDDEN_CODE_HINT_TEXT, {
        fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
        fontSize: '15px',
        color: '#fff7c7',
        fontStyle: 'bold',
        stroke: '#0c1020',
        strokeThickness: 5,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(14)
    const dragonHintBlinkTween = this.tweens.add({
      targets: dragonHintText,
      alpha: { from: 1, to: 0.42 },
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true,
    })
    let dragonHintTransitionLocked = false

    const mainMenuTexts = [startText, achievementsText]
    let mainMenuPulseTween: Phaser.Tweens.Tween | null = null

    let mobileStartText: Phaser.GameObjects.Text | null = null
    const getContentObjects = (): FadableGameObject[] =>
      ([
        titleLogo,
        subtitleText,
        startText,
        achievementsText,
        titleSparkles,
        mobileStartText,
      ].filter(Boolean) as FadableGameObject[])

    const updateDragonHint = () => {
      const shouldShow = !dragonHintTransitionLocked && !this.dragonSelected && hasBrideGameClear()
      dragonHintText.setVisible(shouldShow)
      dragonHintText.setColor(modeStyle.accentColor)
      if (shouldShow) {
        if (!dragonHintBlinkTween.isPlaying()) {
          dragonHintText.setAlpha(1)
          dragonHintBlinkTween.resume()
        }
      } else {
        dragonHintBlinkTween.pause()
      }
    }
    updateDragonHint()

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

    const updateMainMenu = () => {
      mainMenuPulseTween?.stop()
      mainMenuPulseTween = null
      mainMenuTexts.forEach((text, index) => {
        const selected = index === mainMenuSelectedIndex
        text.setText(`${selected ? '▶ ' : '  '}${TITLE_MENU_OPTIONS[index]}`)
        text.setColor(selected ? modeStyle.accentColor : '#e0e0e0')
        text.setAlpha(selected ? 1 : 0.74)
        text.setScale(selected ? 1.04 : 1)
      })
      mainMenuPulseTween = this.tweens.add({
        targets: mainMenuTexts[mainMenuSelectedIndex],
        scale: { from: 1.04, to: 1.075 },
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
    updateMainMenu()

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
      updateDragonHint()
      updateMainMenu()
      mobileStartText?.setText(TITLE_MENU_OPTIONS[0])
    }

    const switchTitleMode = (nextMode: GameModeId) => {
      if (this.modeTransitioning) return
      this.modeTransitioning = true
      this.hiddenCodeIndex = 0
      dragonHintTransitionLocked = true
      dragonHintBlinkTween.pause()
      dragonHintText.setAlpha(0)
      dragonHintText.setVisible(false)
      mainMenuPulseTween?.pause()
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
        if (nextMode === 'dragon') {
          progressStorage.recordDragonModeUnlocked()
        }
        applyModeContent()
        getContentObjects().forEach((object) => object.setAlpha(0))

        runStripeWipe('reveal', () => {
          this.tweens.add({
            targets: getContentObjects(),
            alpha: 1,
            duration: 120,
            ease: 'Quad.easeOut',
            onComplete: () => {
              mainMenuPulseTween?.resume()
              dragonHintTransitionLocked = false
              updateDragonHint()
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
      achievementsText.setVisible(true)
      updateDragonHint()
      mobileStartText?.setVisible(true)
    }

    const closeAchievementsPanel = () => {
      achievementsPanel?.destroy(true)
      achievementsPanel = null
      achievementsContent = null
      achievementsScrollThumb = null
      achievementsScrollY = 0
      achievementsMinScrollY = 0
      startText.setVisible(true)
      achievementsText.setVisible(true)
      updateDragonHint()
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

    const applyAchievementsScroll = (deltaY: number) => {
      if (!achievementsContent) return
      achievementsScrollY = Phaser.Math.Clamp(achievementsScrollY + deltaY, achievementsMinScrollY, 0)
      const contentBaseY = achievementsContent.getData('baseY') as number
      achievementsContent.setY(contentBaseY + achievementsScrollY)
      if (achievementsScrollThumb) {
        const scrollRange = Math.abs(achievementsMinScrollY)
        const trackTop = achievementsScrollThumb.getData('trackTop') as number
        const trackRange = achievementsScrollThumb.getData('trackRange') as number
        const progress = scrollRange > 0 ? Math.abs(achievementsScrollY) / scrollRange : 0
        achievementsScrollThumb.setY(trackTop + trackRange * progress)
      }
    }

    const showDifficultyPanel = (preserveSelection = false) => {
      if (this.started || this.modeTransitioning) return
      const shouldResetSelection = !difficultyPanel && !preserveSelection
      closeAchievementsPanel()
      closeStageSelectPanel()
      closeCutsceneSelectPanel()
      closeDifficultyPanel()
      if (shouldResetSelection) {
        difficultyPanelSelectedIndex = getDifficultyOptionIndex(getSelectedDifficultyId())
      }
      startText.setVisible(false)
      achievementsText.setVisible(false)
      dragonHintText.setVisible(false)
      mobileStartText?.setVisible(false)
      const container = this.add.container(0, 0).setDepth(120)
      difficultyPanel = container
      const texts: Phaser.GameObjects.Text[] = []
      let difficultyPulseTween: Phaser.Tweens.Tween | null = null

      const updateSelection = () => {
        difficultyPulseTween?.stop()
        difficultyPulseTween = null
        DIFFICULTY_OPTIONS.forEach((id, index) => {
          const selected = index === difficultyPanelSelectedIndex
          texts[index].setText(selected ? `< ${id.toUpperCase()} >` : id.toUpperCase())
          texts[index].setColor(selected ? modeStyle.accentColor : '#e0e0e0')
          texts[index].setAlpha(selected ? 1 : 0.68)
          texts[index].setScale(selected ? 1.08 : 1)
        })
        difficultyPulseTween = this.tweens.add({
          targets: texts[difficultyPanelSelectedIndex],
          scale: { from: 1.08, to: 1.13 },
          duration: 720,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
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

    const showAchievementsPanel = () => {
      if (this.started || this.modeTransitioning) return
      closeDifficultyPanel()
      closeStageSelectPanel()
      closeCutsceneSelectPanel()
      closeAchievementsPanel()
      startText.setVisible(false)
      achievementsText.setVisible(false)
      dragonHintText.setVisible(false)
      mobileStartText?.setVisible(false)

      const snapshot = progressStorage.getSnapshot()
      const unlocked = new Set(snapshot.unlockedAchievementIds)
      const unlockedCount = ACHIEVEMENTS.filter((achievement) => unlocked.has(achievement.id)).length
      const panelX = 32
      const panelY = 34
      const panelWidth = GAME_WIDTH - panelX * 2
      const panelHeight = GAME_HEIGHT - panelY * 2
      const rowX = panelX + 16
      const rowWidth = panelWidth - 32
      const listTop = panelY + 88
      const listHeight = panelHeight - 150
      const rowHeight = 50
      const rowGap = 5
      const rowStep = rowHeight + rowGap
      const totalListHeight = ACHIEVEMENTS.length * rowStep - rowGap
      const maxScrollable = Math.max(0, totalListHeight - listHeight)

      const container = this.add.container(0, 0).setDepth(120)
      achievementsPanel = container
      achievementsContent = this.add.container(0, listTop)
      achievementsContent.setData('baseY', listTop)
      achievementsScrollY = 0
      achievementsMinScrollY = -maxScrollable

      const overlay = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050716, 0.66)
        .setInteractive()
      const panel = this.add.graphics()
      panel.fillStyle(0x101827, 0.96)
      panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8)
      panel.lineStyle(2, modeStyle.accentNumber, 0.86)
      panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8)
      const titleText = this.add
        .text(GAME_WIDTH / 2, panelY + 43, `도전 과제 ${unlockedCount}/${ACHIEVEMENTS.length}`, {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: modeStyle.accentColor,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setStroke('#050716', 4)
      const closeBack = this.add
        .rectangle(panelX + panelWidth - 25, panelY + 28, 34, 34, 0x25344f, 0.94)
        .setStrokeStyle(1, modeStyle.accentNumber, 0.7)
        .setInteractive({ useHandCursor: true })
      const closeText = this.add
        .text(closeBack.x, closeBack.y - 1, 'X', {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
      closeBack.on('pointerdown', closeAchievementsPanel)
      closeText.on('pointerdown', closeAchievementsPanel)
      container.add([overlay, panel, titleText, closeBack, closeText, achievementsContent])

      const maskShape = this.add.graphics()
      maskShape.fillStyle(0xffffff, 1)
      maskShape.fillRect(rowX, listTop, rowWidth, listHeight)
      maskShape.setVisible(false)
      achievementsContent.setMask(maskShape.createGeometryMask())
      container.add(maskShape)

      ACHIEVEMENTS.forEach((achievement, index) => {
        const y = index * rowStep + rowHeight / 2
        const hidden = achievement.hiddenUntilDragonUnlocked && !snapshot.dragonModeUnlocked
        const achieved = unlocked.has(achievement.id)
        const rowBack = this.add
          .rectangle(rowX + rowWidth / 2, y, rowWidth, rowHeight, achieved ? 0x1d3246 : 0x172033, achieved ? 0.96 : 0.76)
          .setStrokeStyle(1, achievement.hardFrame ? 0xffd76d : 0xffffff, achieved ? 0.5 : 0.14)
        achievementsContent?.add(rowBack)

        if (hidden) {
          const hiddenIcon = this.add
            .text(rowX + 22, y, '???', {
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#8f9aaa',
              fontStyle: 'bold',
            })
            .setOrigin(0.5)
          achievementsContent?.add(hiddenIcon)
        } else {
          const icon = this.add
            .image(rowX + 22, y, `achievement-${achievement.iconKey}`)
            .setDisplaySize(32, 32)
            .setAlpha(achieved ? 1 : 0.42)
          achievementsContent?.add(icon)
          if (achievement.hardFrame) {
            const frame = this.add.graphics()
            frame.lineStyle(2, 0xffd76d, achieved ? 0.95 : 0.42)
            frame.strokeRoundedRect(rowX + 4, y - 18, 36, 36, 4)
            achievementsContent?.add(frame)
          }
        }

        const title = this.add
          .text(rowX + 48, y - 18, hidden ? '???' : achievement.name, {
            fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
            fontSize: '14px',
            color: achieved ? modeStyle.accentColor : hidden ? '#8f9aaa' : '#e0e0e0',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0)
        const description = this.add
          .text(rowX + 48, y + 2, hidden ? '???' : achievement.description, {
            fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
            fontSize: '9px',
            color: achieved ? '#cfd8ef' : '#9aa5b8',
            wordWrap: { width: rowWidth - 104 },
          })
          .setOrigin(0, 0)
        const status = this.add
          .text(rowX + rowWidth - 28, y, achieved ? 'CLEAR' : '--', {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: achieved ? '#ffd76d' : '#6f7b8f',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
        achievementsContent?.add([title, description, status])
      })

      if (maxScrollable > 0) {
        const trackX = panelX + panelWidth - 12
        const trackTop = listTop + 4
        const trackHeight = listHeight - 8
        const thumbHeight = Math.max(42, trackHeight * (listHeight / totalListHeight))
        const track = this.add
          .rectangle(trackX, listTop + listHeight / 2, 4, trackHeight, 0xffffff, 0.12)
          .setOrigin(0.5)
        achievementsScrollThumb = this.add
          .rectangle(trackX, trackTop + thumbHeight / 2, 6, thumbHeight, modeStyle.accentNumber, 0.78)
          .setOrigin(0.5)
        achievementsScrollThumb.setData('trackTop', trackTop + thumbHeight / 2)
        achievementsScrollThumb.setData('trackRange', trackHeight - thumbHeight)
        container.add([track, achievementsScrollThumb])
      }

      let dragging = false
      let lastPointerY = 0
      overlay.on('pointerup', () => {
        dragging = false
      })
      const dragZone = this.add
        .rectangle(rowX + rowWidth / 2, listTop + listHeight / 2, rowWidth, listHeight, 0x000000, 0)
        .setInteractive()
      dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        dragging = true
        lastPointerY = pointer.y
      })
      dragZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (!dragging || !pointer.isDown) return
        const deltaY = pointer.y - lastPointerY
        lastPointerY = pointer.y
        applyAchievementsScroll(deltaY)
      })
      dragZone.on('pointerup', () => {
        dragging = false
      })
      dragZone.on('pointerout', () => {
        dragging = false
      })
      container.add(dragZone)

      const closeHint = this.add
        .text(GAME_WIDTH / 2, panelY + panelHeight - 28, '스크롤해서 보기 / X: 닫기', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#9aa5b8',
        })
        .setOrigin(0.5)
      container.add(closeHint)
    }

    const showStageSelectPanel = (stageIndex: number, replaceOpenPanel = false) => {
      if (this.started || this.modeTransitioning) return
      if (stageSelectPanel && stageSelectStageIndex === stageIndex && !replaceOpenPanel) {
        closeStageSelectPanel()
        return
      }
      const shouldResetSelection = !stageSelectPanel || !replaceOpenPanel
      closeAchievementsPanel()
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
        const difficultyIndex = index - STAGE_SELECT_DIFFICULTY_START_INDEX
        if (difficultyIndex >= 0 && difficultyIndex < DIFFICULTY_OPTIONS.length) {
          const difficultyId = DIFFICULTY_OPTIONS[difficultyIndex]
          return `${difficultyId.toUpperCase()} ${stageSelectDifficultyId === difficultyId ? 'ON' : 'OFF'}`
        }
        if (index === STAGE_SELECT_HITBOX_INDEX) return `HITBOX ${isHitboxDebugEnabled() ? 'ON' : 'OFF'}`
        return 'START'
      }

      const updateSelection = () => {
        rows.forEach((text, index) => {
          const selected = index === stageSelectSelectedIndex
          const activeStage = index < STAGES.length && index === stageSelectStageIndex
          const difficultyIndex = index - STAGE_SELECT_DIFFICULTY_START_INDEX
          const activeDifficulty =
            difficultyIndex >= 0 &&
            difficultyIndex < DIFFICULTY_OPTIONS.length &&
            stageSelectDifficultyId === DIFFICULTY_OPTIONS[difficultyIndex]
          const active = activeStage || activeDifficulty || (index === STAGE_SELECT_HITBOX_INDEX && isHitboxDebugEnabled())
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
        else if (
          index >= STAGE_SELECT_DIFFICULTY_START_INDEX &&
          index < STAGE_SELECT_DIFFICULTY_START_INDEX + DIFFICULTY_OPTIONS.length
        ) {
          stageSelectDifficultyId = DIFFICULTY_OPTIONS[index - STAGE_SELECT_DIFFICULTY_START_INDEX]
        } else if (index === STAGE_SELECT_HITBOX_INDEX) toggleHitboxDebug()
        else startStageDirectly(stageSelectStageIndex, stageSelectDifficultyId)
        updateSelection()
      }

      for (let index = 0; index < STAGE_SELECT_ROW_COUNT; index++) {
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
      closeAchievementsPanel()
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
        const direction = event.code === 'ArrowUp' || event.code === 'ArrowLeft' ? -1 : 1
        difficultyPanelSelectedIndex = Phaser.Math.Wrap(
          difficultyPanelSelectedIndex + direction,
          0,
          DIFFICULTY_OPTIONS.length,
        )
        difficultyPanel.destroy(true)
        difficultyPanel = null
        showDifficultyPanel(true)
        return true
      }
      if (event.code === 'KeyE') {
        startIntroWithDifficulty('easy')
        return true
      }
      if (event.code === 'KeyN') {
        startIntroWithDifficulty('normal')
        return true
      }
      if (event.code === 'KeyH') {
        startIntroWithDifficulty('hard')
        return true
      }
      if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyZ' || event.code === 'KeyX') {
        startIntroWithDifficulty(DIFFICULTY_OPTIONS[difficultyPanelSelectedIndex])
        return true
      }
      return true
    }

    const handleAchievementsPanelKey = (event: KeyboardEvent) => {
      if (!achievementsPanel) return false
      if (event.repeat) return true
      if (event.code === 'ArrowUp') {
        applyAchievementsScroll(42)
        return true
      }
      if (event.code === 'ArrowDown') {
        applyAchievementsScroll(-42)
        return true
      }
      if (
        event.code === 'Escape' ||
        event.code === 'Enter' ||
        event.code === 'Space' ||
        event.code === 'KeyZ' ||
        event.code === 'KeyX'
      ) {
        closeAchievementsPanel()
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
        stageSelectSelectedIndex = Phaser.Math.Wrap(stageSelectSelectedIndex - 1, 0, STAGE_SELECT_ROW_COUNT)
        showStageSelectPanel(stageSelectStageIndex, true)
        return true
      }
      if (event.code === 'ArrowDown') {
        stageSelectSelectedIndex = Phaser.Math.Wrap(stageSelectSelectedIndex + 1, 0, STAGE_SELECT_ROW_COUNT)
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
      if (event.code === 'KeyN') {
        stageSelectDifficultyId = 'normal'
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
        else if (
          stageSelectSelectedIndex >= STAGE_SELECT_DIFFICULTY_START_INDEX &&
          stageSelectSelectedIndex < STAGE_SELECT_DIFFICULTY_START_INDEX + DIFFICULTY_OPTIONS.length
        ) {
          stageSelectDifficultyId = DIFFICULTY_OPTIONS[stageSelectSelectedIndex - STAGE_SELECT_DIFFICULTY_START_INDEX]
        } else if (stageSelectSelectedIndex === STAGE_SELECT_HITBOX_INDEX) toggleHitboxDebug()
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

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (!achievementsPanel) return
      applyAchievementsScroll(-dy * 0.45)
    })

    const activateMainMenu = () => {
      if (mainMenuSelectedIndex === 0) showDifficultyPanel()
      else showAchievementsPanel()
    }

    startText.on('pointerover', () => {
      mainMenuSelectedIndex = 0
      updateMainMenu()
    })
    achievementsText.on('pointerover', () => {
      mainMenuSelectedIndex = 1
      updateMainMenu()
    })
    startText.on('pointerdown', () => {
      mainMenuSelectedIndex = 0
      updateMainMenu()
      activateMainMenu()
    })
    achievementsText.on('pointerdown', () => {
      mainMenuSelectedIndex = 1
      updateMainMenu()
      activateMainMenu()
    })
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (handleAchievementsPanelKey(event)) return
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
      if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        mainMenuSelectedIndex = mainMenuSelectedIndex === 0 ? 1 : 0
        updateMainMenu()
        return
      }
      if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyZ' || event.code === 'KeyX') {
        if (event.repeat) return
        activateMainMenu()
      }
    })

    if (!this.sys.game.device.os.desktop) {
      mobileStartText = this.createMobileTitleControls(recordCodeInput, activateMainMenu, showAchievementsPanel)
    }

    this.cameras.main.fadeIn(500, 0, 0, 0)
  }

  private createMobileTitleControls(
    recordCodeInput: (input: HiddenCodeInput) => void,
    start: () => void,
    showAchievements: () => void,
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
    startButtonText = makeButton(276, 96, TITLE_MENU_OPTIONS[0], start)
    makeButton(374, 86, '도전', showAchievements)
    return startButtonText
  }
}
