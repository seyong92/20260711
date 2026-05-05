import Phaser from 'phaser'

export function getArcadeBodyBounds(
  object: Phaser.GameObjects.Components.GetBounds & {
    body?: unknown
  },
) {
  const body = object.body
  if (body && typeof body === 'object' && 'enable' in body && body.enable && 'x' in body && 'width' in body) {
    const arcadeBody = body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody
    return new Phaser.Geom.Rectangle(arcadeBody.x, arcadeBody.y, arcadeBody.width, arcadeBody.height)
  }
  return object.getBounds()
}
