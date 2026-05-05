import Phaser from 'phaser'

import { GAME_WIDTH, ITEM_MIN_Y } from '../constants'

type HudTextTheme = 'dark' | 'light'

const BOSS_HP_WIDTH = 250
const BOSS_HP_HEIGHT = 14
const BOSS_HP_X = (GAME_WIDTH - BOSS_HP_WIDTH) / 2
const BOSS_HP_Y = ITEM_MIN_Y - 34

export class HUD {
  private hpIcons: Phaser.GameObjects.Image[] = []
  private powerIcons: Phaser.GameObjects.Image[] = []
  private scoreText: Phaser.GameObjects.Text
  private stageText: Phaser.GameObjects.Text
  private menuButton: Phaser.GameObjects.Container
  private bossHpBg: Phaser.GameObjects.Rectangle
  private bossHpFill: Phaser.GameObjects.Rectangle
  private bossHpText: Phaser.GameObjects.Text
  private container: Phaser.GameObjects.Container

  constructor(scene: Phaser.Scene, onMenuRequested: () => void) {
    this.container = scene.add.container(0, 0)
    this.container.setDepth(50)
    this.container.setScrollFactor(0)

    this.scoreText = scene.add
      .text(GAME_WIDTH / 2, 10, 'SCORE 0', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffd700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setStroke('#050716', 3)
    this.container.add(this.scoreText)

    this.stageText = scene.add
      .text(GAME_WIDTH / 2, 31, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e0e0e0',
      })
      .setOrigin(0.5, 0)
    this.container.add(this.stageText)

    this.menuButton = this.createMenuButton(scene, onMenuRequested)
    this.container.add(this.menuButton)

    this.bossHpBg = scene.add
      .rectangle(GAME_WIDTH / 2, BOSS_HP_Y, BOSS_HP_WIDTH, BOSS_HP_HEIGHT, 0x071019, 0.58)
      .setStrokeStyle(1, 0xffffff, 0.24)
      .setVisible(false)
    this.container.add(this.bossHpBg)

    this.bossHpFill = scene.add
      .rectangle(BOSS_HP_X + 2, BOSS_HP_Y, BOSS_HP_WIDTH - 4, BOSS_HP_HEIGHT - 4, 0x44d05a, 0.82)
      .setOrigin(0, 0.5)
      .setVisible(false)
    this.container.add(this.bossHpFill)

    this.bossHpText = scene.add
      .text(GAME_WIDTH / 2, BOSS_HP_Y - 18, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#f7fbff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setVisible(false)
    this.container.add(this.bossHpText)
  }

  setTextTheme(theme: HudTextTheme) {
    this.stageText.setColor(theme === 'light' ? '#2f2333' : '#e0e0e0')
    this.stageText.setStroke(theme === 'light' ? '#fff3e2' : '#050716', 3)
  }

  private createMenuButton(scene: Phaser.Scene, onMenuRequested: () => void) {
    const button = scene.add.container(GAME_WIDTH - 28, 25)
    const back = scene.add
      .circle(0, 0, 16, 0x071019, 0.48)
      .setStrokeStyle(1, 0xffd700, 0.36)
      .setInteractive({ useHandCursor: true })
    const icon = scene.add.graphics()
    icon.lineStyle(2, 0xffd700, 0.82)
    icon.lineBetween(-6, -5, 6, -5)
    icon.lineBetween(-7, 0, 7, 0)
    icon.lineBetween(-6, 5, 6, 5)

    const requestMenu = () => onMenuRequested()
    back.on('pointerdown', requestMenu)
    icon.setInteractive(new Phaser.Geom.Circle(0, 0, 16), Phaser.Geom.Circle.Contains)
    icon.on('pointerdown', requestMenu)
    button.add([back, icon])
    return button
  }

  updateHP(current: number, max: number) {
    const baseVisibleCount = 3
    const bonusVisibleCount = max > 3 ? Math.max(0, max - 3) : 0
    const visibleCount = baseVisibleCount + bonusVisibleCount
    this.ensureHpIcons(visibleCount)

    for (let index = 0; index < this.hpIcons.length; index++) {
      if (index < visibleCount) {
        this.hpIcons[index].setVisible(true)
        const isFilled = index < current
        this.hpIcons[index].setFrame(0)
        this.hpIcons[index].setTint(isFilled ? 0xffffff : 0x2f3340)
        this.hpIcons[index].setAlpha(isFilled ? 1 : 0.5)
      } else {
        this.hpIcons[index].setVisible(false)
      }
    }
  }

  private ensureHpIcons(max: number) {
    while (this.hpIcons.length < max) {
      const index = this.hpIcons.length
      const heart = this.container.scene.add
        .image(24 + index * 24, 26, 'item-pickups', 0)
        .setDisplaySize(23, 23)
      this.hpIcons.push(heart)
      this.container.add(heart)
    }
  }

  updatePower(powerDisplayCount: number, character: 'bride' | 'dragon') {
    const visibleCount = Math.max(1, powerDisplayCount)
    this.ensurePowerIcons(visibleCount)
    const frame = character === 'dragon' ? 8 : 4

    for (let index = 0; index < this.powerIcons.length; index++) {
      if (index < visibleCount) {
        this.powerIcons[index]
          .setVisible(true)
          .setFrame(frame)
          .setDisplaySize(character === 'dragon' ? 22 : 20, character === 'dragon' ? 22 : 20)
          .setAlpha(0.95)
      } else {
        this.powerIcons[index].setVisible(false)
      }
    }
  }

  private ensurePowerIcons(max: number) {
    while (this.powerIcons.length < max) {
      const index = this.powerIcons.length
      const icon = this.container.scene.add
        .image(24 + index * 22, 52, 'item-pickups', 4)
        .setDisplaySize(20, 20)
      this.powerIcons.push(icon)
      this.container.add(icon)
    }
  }

  updateScore(score: number) {
    this.scoreText.setText(`SCORE ${score.toLocaleString()}`)
  }

  setStage(text: string) {
    this.stageText.setText(text)
  }

  showBossHP(name: string, current: number, max: number) {
    const ratio = Phaser.Math.Clamp(current / max, 0, 1)
    const color = ratio <= 0.2 ? 0xe94545 : ratio <= 0.5 ? 0xf2d24b : 0x44d05a
    const fillWidth = Math.max(0, (BOSS_HP_WIDTH - 4) * ratio)
    this.bossHpBg.setVisible(true)
    this.bossHpFill.setVisible(true).setFillStyle(color, 0.86).setDisplaySize(fillWidth, BOSS_HP_HEIGHT - 4)
    this.bossHpText.setVisible(true).setText(`${name} HP`)
  }

  destroy() {
    this.container.destroy(true)
  }
}
