import Phaser from 'phaser'

import {
  ACHIEVEMENT_EVENT,
  ACHIEVEMENTS,
  type AchievementDefinition,
  type AchievementId,
} from '../../content/achievements'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants'

const TOAST_WIDTH = 252
const TOAST_HEIGHT = 76
const TOAST_MARGIN = 10
const TOAST_VISIBLE_MS = 2600
const TOAST_ICON_SIZE = 42

export class AchievementOverlayScene extends Phaser.Scene {
  private queue: AchievementDefinition[] = []
  private showing = false

  constructor() {
    super({ key: 'AchievementOverlayScene', active: false })
  }

  create() {
    this.scene.bringToTop()
    this.game.events.on(ACHIEVEMENT_EVENT, this.enqueueAchievements, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(ACHIEVEMENT_EVENT, this.enqueueAchievements, this)
    })
  }

  update() {
    this.scene.bringToTop()
  }

  private enqueueAchievements(ids: AchievementId[]) {
    ids.forEach((id) => {
      const achievement = ACHIEVEMENTS.find((item) => item.id === id)
      if (achievement) this.queue.push(achievement)
    })
    if (!this.showing) {
      this.showNext()
    }
  }

  private showNext() {
    const achievement = this.queue.shift()
    if (!achievement) {
      this.showing = false
      return
    }

    this.showing = true
    this.scene.bringToTop()
    const x = GAME_WIDTH - TOAST_MARGIN
    const y = GAME_HEIGHT - TOAST_MARGIN - TOAST_HEIGHT
    const container = this.add.container(x + TOAST_WIDTH + 8, y).setDepth(1000)
    const bg = this.add.graphics()
    bg.fillStyle(0x101827, 0.96)
    bg.fillRoundedRect(-TOAST_WIDTH, 0, TOAST_WIDTH, TOAST_HEIGHT, 8)
    bg.lineStyle(2, achievement.hardFrame ? 0xffd76d : 0x8ff4ff, 0.9)
    bg.strokeRoundedRect(-TOAST_WIDTH, 0, TOAST_WIDTH, TOAST_HEIGHT, 8)

    const icon = this.add
      .image(-TOAST_WIDTH + 36, TOAST_HEIGHT / 2, `achievement-${achievement.iconKey}`)
      .setDisplaySize(TOAST_ICON_SIZE, TOAST_ICON_SIZE)
      .setOrigin(0.5)

    if (achievement.hardFrame) {
      const frame = this.add.graphics()
      frame.lineStyle(3, 0xffd76d, 1)
      frame.strokeRoundedRect(
        icon.x - TOAST_ICON_SIZE / 2 - 3,
        icon.y - TOAST_ICON_SIZE / 2 - 3,
        TOAST_ICON_SIZE + 6,
        TOAST_ICON_SIZE + 6,
        4,
      )
      container.add(frame)
    }

    const label = this.add
      .text(-TOAST_WIDTH + 66, 15, '도전과제 달성', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: achievement.hardFrame ? '#ffd76d' : '#8ff4ff',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0)
    const title = this.add
      .text(-TOAST_WIDTH + 66, 34, achievement.name, {
        fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0)
      .setStroke('#050716', 3)

    container.add([bg, icon, label, title])

    this.tweens.add({
      targets: container,
      x,
      duration: 220,
      ease: 'Cubic.easeOut',
    })
    this.tweens.add({
      targets: container,
      x: x + TOAST_WIDTH + 8,
      alpha: 0,
      delay: TOAST_VISIBLE_MS,
      duration: 220,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        container.destroy(true)
        this.showNext()
      },
    })
  }
}
