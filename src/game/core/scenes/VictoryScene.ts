import Phaser from 'phaser'

import { getSelectedDifficultyId } from '../../content/difficulty'
import { getGameModeContent } from '../../content/gameContent'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants'
import { getSelectedPlayerCharacter } from '../systems/PlayerSelection'
import { progressStorage } from '../systems/ProgressStorage'
import { scoreManager } from '../systems/ScoreManager'

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' })
  }

  create() {
    const character = getSelectedPlayerCharacter()
    const difficulty = getSelectedDifficultyId()
    const modeContent = getGameModeContent(character)
    scoreManager.addClearBonus()
    this.cameras.main.fadeIn(500, 0, 0, 0)
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050716, 1)

    const score = scoreManager.getScore()
    const playTime = scoreManager.getPlayTime()
    progressStorage.recordHighScore(character, difficulty, score)
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, `${modeContent.uiLabels.finalScoreLabel}: ${score.toLocaleString()}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffd700',
      })
      .setOrigin(0.5)

    const minutes = Math.floor(playTime / 60000)
    const seconds = Math.floor((playTime % 60000) / 1000)
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.48, `${modeContent.uiLabels.playTimeLabel}: ${minutes}분 ${seconds}초`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#aaa',
      })
      .setOrigin(0.5)

    this.time.delayedCall(600, () => {
      this.game.events.emit('game-ended', { score, playTime, character, difficulty })
    })

    this.game.events.once('restart-game', () => {
      this.scene.start('TitleScene')
    })
  }
}
