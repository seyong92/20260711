import Phaser from 'phaser'

import { GAME_HEIGHT, GAME_WIDTH } from '../constants'

export interface GameInput {
  jump: boolean
  jumpUp: boolean
  attackDown: boolean
  attackUp: boolean
  left: boolean
  right: boolean
}

const CONTROL_H = 90
const CONTROL_Y = GAME_HEIGHT - CONTROL_H
const MOVE_W = GAME_WIDTH * 0.5
const ACTION_W = (GAME_WIDTH - MOVE_W) * 0.5
const ATTACK_X = MOVE_W
const ATTACK_W = ACTION_W
const JUMP_X = ATTACK_X + ATTACK_W
const JUMP_W = GAME_WIDTH - JUMP_X
const MOVE_CENTER_X = MOVE_W / 2
const DEAD_ZONE = 12

type ActionButton = 'jump' | 'attack'

interface ActionPointerState {
  attackHeld: boolean
  jumpInside: boolean
}

export class TouchControls {
  private scene: Phaser.Scene
  private input: GameInput = {
    jump: false,
    jumpUp: false,
    attackDown: false,
    attackUp: false,
    left: false,
    right: false,
  }
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  private keyZ: Phaser.Input.Keyboard.Key | null = null
  private keyX: Phaser.Input.Keyboard.Key | null = null
  private movePointerId: number | null = null
  private actionPointerStates = new Map<number, ActionPointerState>()
  private jumpPointerIds = new Set<number>()
  private attackPointerIds = new Set<number>()
  private gfx: Phaser.GameObjects.Graphics | null = null
  private moveThumb: Phaser.GameObjects.Graphics | null = null
  private jumpLabel: Phaser.GameObjects.Text | null = null
  private attackLabel: Phaser.GameObjects.Text | null = null
  private leftArrow: Phaser.GameObjects.Text | null = null
  private rightArrow: Phaser.GameObjects.Text | null = null
  private touchLeft = false
  private touchRight = false
  private isDesktop: boolean

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.isDesktop = scene.sys.game.device.os.desktop

    if (!this.isDesktop) {
      this.createMobileUI()
      scene.input.on('pointerdown', this.onPointerDown, this)
      scene.input.on('pointermove', this.onPointerMove, this)
      scene.input.on('pointerup', this.onPointerUp, this)
      scene.input.on('pointerupoutside', this.onPointerUp, this)
    }

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys()
      this.keyZ = scene.input.keyboard.addKey('Z')
      this.keyX = scene.input.keyboard.addKey('X')
    }
  }

  private createMobileUI() {
    const scene = this.scene
    this.gfx = scene.add.graphics().setDepth(98)
    this.gfx.fillStyle(0x000000, 0.25)
    this.gfx.fillRoundedRect(4, CONTROL_Y + 4, MOVE_W - 8, CONTROL_H - 8, 8)
    this.gfx.fillRoundedRect(ATTACK_X + 2, CONTROL_Y + 4, ATTACK_W - 6, CONTROL_H - 8, 8)
    this.gfx.fillRoundedRect(JUMP_X + 2, CONTROL_Y + 4, JUMP_W - 6, CONTROL_H - 8, 8)
    this.gfx.lineStyle(1, 0xffffff, 0.15)
    this.gfx.lineBetween(0, CONTROL_Y, GAME_WIDTH, CONTROL_Y)
    this.gfx.lineBetween(JUMP_X, CONTROL_Y + 8, JUMP_X, GAME_HEIGHT - 8)
    this.moveThumb = scene.add.graphics().setDepth(99).setAlpha(0)
    this.leftArrow = scene.add
      .text(MOVE_W * 0.2, CONTROL_Y + CONTROL_H / 2, '◀', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(99)
      .setAlpha(0.3)
    this.rightArrow = scene.add
      .text(MOVE_W * 0.8, CONTROL_Y + CONTROL_H / 2, '▶', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(99)
      .setAlpha(0.3)
    this.attackLabel = scene.add
      .text(ATTACK_X + ATTACK_W / 2, CONTROL_Y + CONTROL_H / 2, 'ATK', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(99)
      .setAlpha(0.35)
    this.jumpLabel = scene.add
      .text(JUMP_X + JUMP_W / 2, CONTROL_Y + CONTROL_H / 2, 'JUMP', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(99)
      .setAlpha(0.35)
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (pointer.y < CONTROL_Y) return
    if (pointer.x < MOVE_W) {
      this.movePointerId = pointer.id
      this.updateMoveDirection(pointer.x)
      this.showThumb(pointer.x)
      return
    }

    this.actionPointerStates.set(pointer.id, {
      attackHeld: false,
      jumpInside: false,
    })
    this.syncActionPointer(pointer)
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (pointer.id === this.movePointerId) {
      this.updateMoveDirection(pointer.x)
      this.showThumb(pointer.x)
      return
    }

    this.syncActionPointer(pointer)
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (pointer.id === this.movePointerId) {
      this.movePointerId = null
      this.touchLeft = false
      this.touchRight = false
      this.moveThumb?.setAlpha(0)
      this.leftArrow?.setAlpha(0.3)
      this.rightArrow?.setAlpha(0.3)
    }

    const actionState = this.actionPointerStates.get(pointer.id)
    if (!actionState) return
    if (actionState.jumpInside) {
      this.releaseActionButton('jump', pointer.id)
    }
    if (actionState.attackHeld) {
      this.releaseActionButton('attack', pointer.id)
    }
    this.actionPointerStates.delete(pointer.id)
  }

  private getActionButtonAt(pointer: Phaser.Input.Pointer): ActionButton | null {
    if (pointer.y < CONTROL_Y || pointer.x < ATTACK_X) return null
    return pointer.x < JUMP_X ? 'attack' : 'jump'
  }

  private syncActionPointer(pointer: Phaser.Input.Pointer) {
    const actionState = this.actionPointerStates.get(pointer.id)
    if (!actionState) return

    const hovered = this.getActionButtonAt(pointer)
    if (hovered === 'attack' && !actionState.attackHeld) {
      actionState.attackHeld = true
      this.pressActionButton('attack', pointer.id)
    }

    const nextJumpInside = hovered === 'jump'
    if (nextJumpInside === actionState.jumpInside) return
    if (nextJumpInside) {
      this.pressActionButton('jump', pointer.id)
    } else {
      this.releaseActionButton('jump', pointer.id)
    }
    actionState.jumpInside = nextJumpInside
  }

  private pressActionButton(action: ActionButton, pointerId: number) {
    const pointerIds =
      action === 'jump' ? this.jumpPointerIds : this.attackPointerIds
    const wasInactive = pointerIds.size === 0
    pointerIds.add(pointerId)

    if (action === 'jump') {
      if (wasInactive) this.input.jump = true
      this.jumpLabel?.setAlpha(0.7)
      return
    }

    if (wasInactive) this.input.attackDown = true
    this.attackLabel?.setAlpha(0.7)
  }

  private releaseActionButton(action: ActionButton, pointerId: number) {
    const pointerIds =
      action === 'jump' ? this.jumpPointerIds : this.attackPointerIds
    if (!pointerIds.delete(pointerId) || pointerIds.size > 0) return

    if (action === 'jump') {
      this.input.jumpUp = true
      this.jumpLabel?.setAlpha(0.35)
      return
    }

    this.input.attackUp = true
    this.attackLabel?.setAlpha(0.35)
  }

  private updateMoveDirection(x: number) {
    const relative = x - MOVE_CENTER_X
    this.touchLeft = relative < -DEAD_ZONE
    this.touchRight = relative > DEAD_ZONE
    this.leftArrow?.setAlpha(this.touchLeft ? 0.8 : 0.3)
    this.rightArrow?.setAlpha(this.touchRight ? 0.8 : 0.3)
  }

  private showThumb(x: number) {
    if (!this.moveThumb) return
    const cx = Phaser.Math.Clamp(x, 12, MOVE_W - 12)
    this.moveThumb.clear()
    this.moveThumb.fillStyle(0xffffff, 0.35)
    this.moveThumb.fillCircle(cx, CONTROL_Y + CONTROL_H / 2, 14)
    this.moveThumb.setAlpha(1)
  }

  getInput() {
    const result = { ...this.input }
    result.left = this.touchLeft
    result.right = this.touchRight

    if (this.keyZ) {
      if (Phaser.Input.Keyboard.JustDown(this.keyZ)) result.jump = true
      if (Phaser.Input.Keyboard.JustUp(this.keyZ)) result.jumpUp = true
    }
    if (this.keyX) {
      if (Phaser.Input.Keyboard.JustDown(this.keyX)) result.attackDown = true
      if (Phaser.Input.Keyboard.JustUp(this.keyX)) result.attackUp = true
    }
    if (this.cursors) {
      if (this.cursors.left.isDown) result.left = true
      if (this.cursors.right.isDown) result.right = true
    }

    this.input.jump = false
    this.input.jumpUp = false
    this.input.attackDown = false
    this.input.attackUp = false
    return result
  }

  resetTransientInput() {
    this.input.jump = false
    this.input.jumpUp = false
    this.input.attackDown = false
    this.input.attackUp = false
    this.movePointerId = null
    this.actionPointerStates.clear()
    this.jumpPointerIds.clear()
    this.attackPointerIds.clear()
    this.touchLeft = false
    this.touchRight = false
    this.moveThumb?.setAlpha(0)
    this.leftArrow?.setAlpha(0.3)
    this.rightArrow?.setAlpha(0.3)
    this.jumpLabel?.setAlpha(0.35)
    this.attackLabel?.setAlpha(0.35)
  }

  destroy() {
    if (!this.isDesktop) {
      this.scene.input.off('pointerdown', this.onPointerDown, this)
      this.scene.input.off('pointermove', this.onPointerMove, this)
      this.scene.input.off('pointerup', this.onPointerUp, this)
      this.scene.input.off('pointerupoutside', this.onPointerUp, this)
    }
    this.gfx?.destroy()
    this.moveThumb?.destroy()
    this.jumpLabel?.destroy()
    this.attackLabel?.destroy()
    this.leftArrow?.destroy()
    this.rightArrow?.destroy()
  }
}
