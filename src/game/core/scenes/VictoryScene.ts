import Phaser from 'phaser'

import { getGameModeContent } from '../../content/gameContent'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants'
import { getSelectedPlayerCharacter } from '../systems/PlayerSelection'
import { scoreManager } from '../systems/ScoreManager'

const DRAGON_PLAYER_SOURCE_SCALE = 1.9875
const VICTORY_CHARACTER_SCALE = 1.875
const VICTORY_DRAGON_SCALE = VICTORY_CHARACTER_SCALE / DRAGON_PLAYER_SOURCE_SCALE

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' })
  }

  create() {
    const character = getSelectedPlayerCharacter()
    const modeContent = getGameModeContent(character)
    scoreManager.addClearBonus()
    this.cameras.main.fadeIn(500, 0, 0, 0)
    this.add.image(0, 0, 'victory-bg').setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050716, 0.08)
    this.add.particles(GAME_WIDTH / 2, GAME_HEIGHT * 0.28, 'particle', {
      speed: { min: 20, max: 80 },
      lifespan: 2000,
      quantity: 2,
      frequency: 100,
      scale: { start: 1.5, end: 0 },
      tint: [0xe94560, 0xffd700, 0xff69b4, 0x6bcb77],
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Circle(0, 0, 80),
        quantity: 1,
      },
    })

    const characterY = GAME_HEIGHT * 0.64
    const hero = this.add.sprite(GAME_WIDTH / 2 - 48, characterY, 'hero', 0)
    hero.setScale(VICTORY_CHARACTER_SCALE)
    hero.play('hero-idle')
    const dragon = this.add.sprite(GAME_WIDTH / 2 + 48, characterY, 'dragon-player', 0)
    dragon.setScale(VICTORY_DRAGON_SCALE)
    dragon.setFlipX(true)
    dragon.play('dragon-player-idle')

    this.time.delayedCall(1000, () => {
      this.tweens.add({ targets: hero, x: GAME_WIDTH / 2 - 20, duration: 800 })
    })
    this.time.delayedCall(2000, () => {
      dragon.play('dragon-player-idle')
      this.cameras.main.shake(200, 0.01)
    })
    this.time.delayedCall(3000, () => {
      const title = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, modeContent.victoryMessages.title, {
          fontFamily: 'monospace',
          fontSize: '30px',
          color: '#ffd700',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0)

      this.tweens.add({
        targets: title,
        alpha: 1,
        scale: { from: 0.5, to: 1 },
        duration: 600,
        ease: 'Back.easeOut',
      })
    })

    this.time.delayedCall(3500, () => {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.76, modeContent.victoryMessages.rescued, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#e0e0e0',
        })
        .setOrigin(0.5)
      this.tweens.add({
        targets: [hero, dragon],
        x: '+=200',
        duration: 3000,
        ease: 'Linear',
      })
    })

    this.time.delayedCall(5000, () => {
      const score = scoreManager.getScore()
      const playTime = scoreManager.getPlayTime()
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.84, `${modeContent.uiLabels.finalScoreLabel}: ${score.toLocaleString()}`, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#ffd700',
        })
        .setOrigin(0.5)

      const minutes = Math.floor(playTime / 60000)
      const seconds = Math.floor((playTime % 60000) / 1000)
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.89, `${modeContent.uiLabels.playTimeLabel}: ${minutes}분 ${seconds}초`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#aaa',
        })
        .setOrigin(0.5)

      this.game.events.emit('game-ended', { score, playTime, character })
    })

    this.game.events.on('restart-game', () => {
      this.game.events.off('restart-game')
      this.scene.start('TitleScene')
    })
  }
}
