import Phaser from 'phaser'

import { getEnemyConfig, type EnemyConfig } from '../../content/enemies'
import { ITEM_CONFIGS } from '../../content/items'
import { type SpawnEvent } from '../../content/stages'
import { Enemy } from '../entities/Enemy'
import { Item } from '../entities/Item'
import { BulletPool } from './BulletPool'

export class EnemySpawner {
  private scene: Phaser.Scene
  private enemies: Phaser.Physics.Arcade.Group
  private items: Phaser.Physics.Arcade.Group
  private bulletPool: BulletPool
  private player: Phaser.GameObjects.Sprite
  private spawns: SpawnEvent[]
  private spawnIndex = 0
  private pendingSpawnEvent: Phaser.Time.TimerEvent | null = null

  constructor(
    scene: Phaser.Scene,
    bulletPool: BulletPool,
    player: Phaser.GameObjects.Sprite,
    spawns: SpawnEvent[],
  ) {
    this.scene = scene
    this.bulletPool = bulletPool
    this.player = player
    this.spawns = spawns
    this.enemies = scene.physics.add.group({ runChildUpdate: true })
    this.items = scene.physics.add.group({ runChildUpdate: true })
    this.scheduleNextSpawn()
  }

  getEnemies() {
    return this.enemies
  }

  getItems() {
    return this.items
  }

  spawnEnemy(config: EnemyConfig, x: number, y: number) {
    const enemy = new Enemy(this.scene, x, y, config)
    enemy.setBulletPool(this.bulletPool)
    enemy.setPlayerRef(this.player)
    this.enemies.add(enemy)
    return enemy
  }

  spawnItem(type: string, x: number, y: number) {
    const config = ITEM_CONFIGS[type]
    if (!config) return
    this.items.add(new Item(this.scene, x, y, config))
  }

  spawnSceneItem(type: string, x: number, y: number, velocity?: { vx: number; vy: number }) {
    const config = ITEM_CONFIGS[type]
    if (!config) return
    const item = new Item(this.scene, x, y, config, velocity)
    this.items.add(item)
    return item
  }

  handleEnemyDeath(enemy: Enemy) {
    const dropItem = enemy.getSpawnMeta()?.dropItem
    if (!dropItem) return
    this.spawnItem(dropItem, enemy.x, enemy.y)
  }

  update() {}

  private scheduleNextSpawn() {
    if (this.spawnIndex >= this.spawns.length) {
      this.pendingSpawnEvent = null
      return
    }

    const previousTime = this.spawnIndex === 0 ? 0 : this.spawns[this.spawnIndex - 1].time
    const nextTime = this.spawns[this.spawnIndex].time
    const delay = Math.max(0, nextTime - previousTime)
    this.pendingSpawnEvent = this.scene.time.delayedCall(delay, () => {
      this.pendingSpawnEvent = null
      this.spawnNextEnemy()
    })
  }

  private spawnNextEnemy() {
    if (this.spawnIndex >= this.spawns.length) return
    const spawn = this.spawns[this.spawnIndex]
    const config = getEnemyConfig(spawn.enemyType)
    if (config) {
      const enemy = this.spawnEnemy(config, spawn.x, spawn.y)
      enemy.setSpawnMeta(spawn)
    }

    this.spawnIndex++
    this.scheduleNextSpawn()
  }

  isAllSpawned() {
    return this.spawnIndex >= this.spawns.length
  }

  getActiveEnemyCount() {
    return this.enemies.countActive()
  }

  destroy() {
    this.pendingSpawnEvent?.remove(false)
    this.pendingSpawnEvent = null
    this.enemies.clear(true, true)
    this.items.clear(true, true)
  }
}
