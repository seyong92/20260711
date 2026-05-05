import Phaser from 'phaser'

import { GAME_WIDTH } from '../constants'

const BUTTON_W = 122
const BUTTON_H = 28
const BUTTON_X = GAME_WIDTH - BUTTON_W / 2 - 10
const BUTTON_Y = 62

interface AutofireToggleCallbacks {
  getEnabled: () => boolean
  setEnabled: (enabled: boolean) => void
}

export class AutofireToggle {
  private scene: Phaser.Scene
  private callbacks: AutofireToggleCallbacks
  private container: Phaser.GameObjects.Container | null = null
  private back: Phaser.GameObjects.Rectangle | null = null
  private label: Phaser.GameObjects.Text | null = null

  constructor(scene: Phaser.Scene, callbacks: AutofireToggleCallbacks) {
    this.scene = scene
    this.callbacks = callbacks

    if (scene.sys.game.device.os.desktop) return
    this.create()
  }

  private create() {
    const container = this.scene.add.container(0, 0).setDepth(210).setScrollFactor(0)
    this.container = container

    this.back = this.scene.add
      .rectangle(BUTTON_X, BUTTON_Y, BUTTON_W, BUTTON_H, 0x101827, 0.9)
      .setStrokeStyle(1, 0xffffff, 0.28)
      .setInteractive({ useHandCursor: true })
    this.label = this.scene.add
      .text(BUTTON_X, BUTTON_Y, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e0e0e0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    const toggle = (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event?: Phaser.Types.Input.EventData) => {
      event?.stopPropagation()
      this.callbacks.setEnabled(!this.callbacks.getEnabled())
      this.update()
    }

    this.back.on('pointerdown', toggle)
    this.label.on('pointerdown', toggle)
    container.add([this.back, this.label])
    this.update()
  }

  private update() {
    const enabled = this.callbacks.getEnabled()
    this.label?.setText(`AUTOFIRE ${enabled ? 'ON' : 'OFF'}`)
    this.label?.setColor(enabled ? '#78ddff' : '#e0e0e0')
    this.back?.setFillStyle(enabled ? 0x183a4a : 0x101827, 0.9)
    this.back?.setStrokeStyle(1, enabled ? 0x78ddff : 0xffffff, enabled ? 0.7 : 0.28)
  }

  destroy() {
    this.container?.destroy(true)
    this.container = null
    this.back = null
    this.label = null
  }
}
