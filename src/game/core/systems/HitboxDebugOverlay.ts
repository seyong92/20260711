import Phaser from 'phaser'

import { Bullet } from './BulletPool'
import { isHitboxDebugEnabled } from './DebugMode'

const ATTACK_COLOR = 0x40ff55
const EFFECT_COLOR = 0xffd24a
const HURT_COLOR = 0xff4040
const WALL_COLOR = 0x4aa3ff
const OVERLAY_ALPHA = 0.92

export class HitboxDebugOverlay {
  private graphics: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(250)
  }

  update(draw: (overlay: HitboxDebugOverlay) => void) {
    this.graphics.clear()
    this.graphics.setVisible(isHitboxDebugEnabled())
    if (!isHitboxDebugEnabled()) return
    draw(this)
  }

  drawAttackRect(bounds: Phaser.Geom.Rectangle) {
    this.drawRect(bounds, ATTACK_COLOR, 2)
  }

  drawEffectRect(bounds: Phaser.Geom.Rectangle) {
    this.drawRect(bounds, EFFECT_COLOR, 1)
  }

  drawAttackLine(line: Phaser.Geom.Line, width: number) {
    this.graphics.lineStyle(Math.max(2, width), ATTACK_COLOR, OVERLAY_ALPHA)
    this.graphics.strokeLineShape(line)
  }

  drawHurtRect(bounds: Phaser.Geom.Rectangle) {
    this.drawRect(bounds, HURT_COLOR, 2)
  }

  drawContactAttackRect(bounds: Phaser.Geom.Rectangle) {
    this.drawRect(
      new Phaser.Geom.Rectangle(bounds.x + 2, bounds.y + 2, Math.max(1, bounds.width - 4), Math.max(1, bounds.height - 4)),
      ATTACK_COLOR,
      1,
    )
  }

  drawWallRect(bounds: Phaser.Geom.Rectangle) {
    this.drawRect(bounds, WALL_COLOR, 2)
  }

  drawBody(
    object: Phaser.GameObjects.GameObject & {
      body?: unknown
    },
    kind: 'attack' | 'hurt' | 'wall',
  ) {
    const bounds = this.getBodyBounds(object)
    if (!bounds) return
    if (kind === 'attack') {
      this.drawAttackRect(bounds)
    } else if (kind === 'wall') {
      this.drawWallRect(bounds)
    } else {
      this.drawHurtRect(bounds)
    }
  }

  drawBullet(bullet: Bullet) {
    if (!bullet.active) return
    const beam = bullet.getDebugBeamSegment()
    if (beam) {
      this.drawAttackLine(beam.line, beam.width)
      return
    }
    this.drawAttackRect(bullet.getHitBounds())
  }

  destroy() {
    this.graphics.destroy()
  }

  private drawRect(bounds: Phaser.Geom.Rectangle, color: number, width: number) {
    this.graphics.lineStyle(width, color, OVERLAY_ALPHA)
    this.graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }

  private getBodyBounds(
    object: Phaser.GameObjects.GameObject & {
      body?: unknown
    },
  ) {
    const body = object.body
    if (
      !body ||
      typeof body !== 'object' ||
      !('enable' in body) ||
      !body.enable ||
      !('x' in body) ||
      !('width' in body)
    ) {
      return null
    }
    const arcadeBody = body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody
    return new Phaser.Geom.Rectangle(arcadeBody.x, arcadeBody.y, arcadeBody.width, arcadeBody.height)
  }
}
