import Phaser from 'phaser'

import { BossScene } from './scenes/BossScene'
import { BootScene } from './scenes/BootScene'
import { GameOverScene } from './scenes/GameOverScene'
import { StageScene } from './scenes/StageScene'
import { StoryScene } from './scenes/StoryScene'
import { TitleScene } from './scenes/TitleScene'
import { VictoryScene } from './scenes/VictoryScene'
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY } from './constants'

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      activePointers: 3,
      touch: { capture: true },
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: GRAVITY },
        debug: false,
      },
    },
    scene: [
      BootScene,
      TitleScene,
      StoryScene,
      StageScene,
      BossScene,
      VictoryScene,
      GameOverScene,
    ],
  }
}
