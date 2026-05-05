let hitboxDebugEnabled = false

export function enableHitboxDebug() {
  hitboxDebugEnabled = true
}

export function toggleHitboxDebug() {
  hitboxDebugEnabled = !hitboxDebugEnabled
  return hitboxDebugEnabled
}

export function isHitboxDebugEnabled() {
  return hitboxDebugEnabled
}
