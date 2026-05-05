import Phaser from 'phaser'

import { GAME_HEIGHT, GAME_WIDTH } from '../constants'

type PauseMenuAction = 'resume' | 'restart' | 'restart-stage' | 'exit'

interface PauseMenuCallbacks {
  onResume: () => void
  onRestart: () => void
  onRestartStage?: () => void
  onExit: () => void
}

interface PauseOption {
  action: PauseMenuAction
  label: string
}

const PANEL_W = 320
const PANEL_H = 250
const PANEL_H_EXTENDED = 292
const PANEL_X = (GAME_WIDTH - PANEL_W) / 2
const PANEL_Y = 190
const PANEL_Y_EXTENDED = 168
const OPTION_W = 254
const OPTION_H = 38
const OPTION_X = GAME_WIDTH / 2
const OPTION_GAP = 44

export class PauseMenu {
  private scene: Phaser.Scene
  private callbacks: PauseMenuCallbacks
  private container: Phaser.GameObjects.Container | null = null
  private optionTexts: Phaser.GameObjects.Text[] = []
  private optionBacks: Phaser.GameObjects.Rectangle[] = []
  private selectedIndex = 0
  private opened = false

  constructor(scene: Phaser.Scene, callbacks: PauseMenuCallbacks) {
    this.scene = scene
    this.callbacks = callbacks
  }

  isOpen() {
    return this.opened
  }

  open() {
    if (this.opened) return
    this.opened = true
    this.selectedIndex = 0
    this.optionTexts = []
    this.optionBacks = []
    const options = this.getOptions()
    const panelH = options.length > 3 ? PANEL_H_EXTENDED : PANEL_H
    const panelY = options.length > 3 ? PANEL_Y_EXTENDED : PANEL_Y
    const optionStartY = panelY + 100

    const container = this.scene.add.container(0, 0)
    container.setDepth(220)
    container.setScrollFactor(0)
    this.container = container

    const overlay = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050716, 0.62)
      .setInteractive()
    container.add(overlay)

    const panel = this.scene.add.graphics()
    panel.fillStyle(0x101827, 0.94)
    panel.fillRoundedRect(PANEL_X, panelY, PANEL_W, panelH, 8)
    panel.lineStyle(2, 0xffd700, 0.62)
    panel.strokeRoundedRect(PANEL_X, panelY, PANEL_W, panelH, 8)
    panel.lineStyle(1, 0xffffff, 0.12)
    panel.strokeRoundedRect(PANEL_X + 6, panelY + 6, PANEL_W - 12, panelH - 12, 6)
    container.add(panel)

    const title = this.scene.add
      .text(GAME_WIDTH / 2, panelY + 38, 'MENU', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffd700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setStroke('#050716', 3)
    container.add(title)

    const closeBack = this.scene.add
      .rectangle(PANEL_X + PANEL_W - 28, panelY + 28, 28, 28, 0x1d293d, 0.92)
      .setStrokeStyle(1, 0xffffff, 0.28)
      .setInteractive({ useHandCursor: true })
    const closeText = this.scene.add
      .text(PANEL_X + PANEL_W - 28, panelY + 27, 'X', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#e0e0e0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    closeBack.on('pointerdown', this.callbacks.onResume)
    closeText.on('pointerdown', this.callbacks.onResume)
    container.add([closeBack, closeText])

    options.forEach((option, index) => {
      const y = optionStartY + index * OPTION_GAP
      const back = this.scene.add
        .rectangle(OPTION_X, y, OPTION_W, OPTION_H, 0x172033, 0.88)
        .setStrokeStyle(1, 0xffffff, 0.2)
        .setInteractive({ useHandCursor: true })
      const text = this.scene.add
        .text(OPTION_X, y, option.label, {
          fontFamily: 'monospace',
          fontSize: option.label.length > 12 ? '13px' : '16px',
          color: '#e0e0e0',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      const selectAndActivate = () => {
        this.selectedIndex = index
        this.updateSelection()
        this.activateSelected()
      }
      back.on('pointerover', () => {
        this.selectedIndex = index
        this.updateSelection()
      })
      text.on('pointerover', () => {
        this.selectedIndex = index
        this.updateSelection()
      })
      back.on('pointerdown', selectAndActivate)
      text.on('pointerdown', selectAndActivate)

      this.optionBacks.push(back)
      this.optionTexts.push(text)
      container.add([back, text])
    })

    this.scene.input.keyboard?.on('keydown', this.handleKeyDown, this)
    this.updateSelection()
  }

  close() {
    if (!this.opened) return
    this.opened = false
    this.scene.input.keyboard?.off('keydown', this.handleKeyDown, this)
    this.container?.destroy(true)
    this.container = null
    this.optionTexts = []
    this.optionBacks = []
  }

  destroy() {
    this.close()
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.opened) return
    if (event.code === 'Escape') {
      event.preventDefault()
      this.callbacks.onResume()
      return
    }
    if (event.code === 'ArrowUp') {
      event.preventDefault()
      this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex - 1, 0, this.getOptions().length)
      this.updateSelection()
      return
    }
    if (event.code === 'ArrowDown') {
      event.preventDefault()
      this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + 1, 0, this.getOptions().length)
      this.updateSelection()
      return
    }
    if (['Enter', 'Space', 'KeyZ', 'KeyX'].includes(event.code)) {
      event.preventDefault()
      this.activateSelected()
    }
  }

  private activateSelected() {
    const action = this.getOptions()[this.selectedIndex]?.action
    if (action === 'resume') this.callbacks.onResume()
    else if (action === 'restart') this.callbacks.onRestart()
    else if (action === 'restart-stage') this.callbacks.onRestartStage?.()
    else if (action === 'exit') this.callbacks.onExit()
  }

  private updateSelection() {
    const options = this.getOptions()
    this.optionTexts.forEach((text, index) => {
      const selected = index === this.selectedIndex
      text.setText(`${selected ? '> ' : '  '}${options[index].label}`)
      text.setColor(selected ? '#ffd700' : '#e0e0e0')
      text.setAlpha(selected ? 1 : 0.72)
    })
    this.optionBacks.forEach((back, index) => {
      const selected = index === this.selectedIndex
      back.setFillStyle(selected ? 0x25344f : 0x172033, selected ? 0.96 : 0.88)
      back.setStrokeStyle(1, selected ? 0xffd700 : 0xffffff, selected ? 0.78 : 0.2)
    })
  }

  private getOptions(): PauseOption[] {
    const restartOptions: PauseOption[] = this.callbacks.onRestartStage
      ? [
          { action: 'restart', label: '처음부터 다시 시작하기' },
          { action: 'restart-stage', label: '해당 스테이지부터 다시 시작하기' },
        ]
      : [{ action: 'restart', label: '다시하기' }]

    return [
      { action: 'resume', label: '계속하기' },
      ...restartOptions,
      { action: 'exit', label: '종료하기' },
    ]
  }
}
