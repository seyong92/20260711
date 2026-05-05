import Phaser from 'phaser'

import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../constants'

type GroundSurface = 'default' | 'rail'

export class ScrollManager {
  private bg: Phaser.GameObjects.TileSprite | null = null
  private groundVisual: Phaser.GameObjects.TileSprite | null = null
  private ground: Phaser.Physics.Arcade.StaticGroup
  private scrollSpeed: number
  private scrollX = 0
  private bgMaxTileOffsetX = 0
  private active = true

  constructor(
    scene: Phaser.Scene,
    bgKey: string,
    scrollSpeed: number,
    groundSurface: GroundSurface = 'default',
    initialScrollX = 0,
  ) {
    this.scrollSpeed = scrollSpeed
    this.scrollX = initialScrollX
    this.bg = scene.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, bgKey)
    this.bg.setOrigin(0, 0)
    this.bg.setScrollFactor(0)
    this.bg.setDepth(-10)
    this.bgMaxTileOffsetX = this.getTextureMaxOffsetX(scene, bgKey)

    this.ground = scene.physics.add.staticGroup()
    const groundTexture = this.getGroundTextureKey(bgKey, groundSurface)
    this.groundVisual = scene.add.tileSprite(
      0,
      GROUND_Y - 14,
      GAME_WIDTH,
      GAME_HEIGHT - GROUND_Y + 14,
      groundTexture,
    )
    this.groundVisual.setOrigin(0, 0)
    this.groundVisual.setScrollFactor(0)
    this.groundVisual.setDepth(-2)
    this.applyScroll()

    const collider = this.ground.create(GAME_WIDTH / 2, GROUND_Y + 48, 'ground-collider')
    ;(collider as Phaser.Physics.Arcade.Sprite)
      .setVisible(false)
      .setDisplaySize(GAME_WIDTH + 96, 96)
      .setImmovable(true)
      .refreshBody()
  }

  getGround() {
    return this.ground
  }

  pause() {
    this.active = false
  }

  getScrollX() {
    return this.scrollX
  }

  update(_time: number, delta: number) {
    if (!this.active) return
    this.scrollX += this.scrollSpeed * (delta / 1000)
    this.applyScroll()
  }

  private applyScroll() {
    if (this.bg) {
      this.bg.tilePositionX = Math.min(this.scrollX * 0.3, this.bgMaxTileOffsetX)
    }
    if (this.groundVisual) {
      this.groundVisual.tilePositionX = this.scrollX
    }
  }

  destroy() {
    this.bg?.destroy()
    this.groundVisual?.destroy()
    this.ground.clear(true, true)
  }

  private getGroundTextureKey(bgKey: string, groundSurface: GroundSurface) {
    if (groundSurface === 'rail' && bgKey === 'stage1-bg') {
      return 'ground-rail-stage1'
    }

    switch (bgKey) {
      case 'stage2-bg':
        return 'ground-stage2'
      case 'stage3-boss-bg':
        return 'ground-stage3-boss'
      case 'stage3-bg':
        return 'ground-stage3'
      case 'stage1-bg':
      default:
        return 'ground-stage1'
    }
  }

  private getTextureMaxOffsetX(scene: Phaser.Scene, key: string) {
    const source = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined
    return Math.max(0, (source?.width ?? GAME_WIDTH) - GAME_WIDTH)
  }
}
