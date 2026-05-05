import Phaser from 'phaser';

import {
  CHARGE_DAMAGE_MULTIPLIER,
  CHARGE_POWER_LEVEL_DAMAGE_MULTIPLIER,
  POWERUP_MAX_LEVEL,
  POWERUP_SHOT_PATTERNS,
} from '../../content/items';
import { GAME_WIDTH } from '../constants';
import { BulletPool } from '../systems/BulletPool';
import type { PlayerCharacterId } from '../systems/PlayerSelection';
import { runState, RUN_MAX_HP_CAP } from '../systems/RunState';
import { getDifficultyConfig } from '../../content/difficulty';
import { scoreManager } from '../systems/ScoreManager';

const INVINCIBLE_DURATION = 1500;
const STAR_SHIELD_WARNING_FAST_MS = 2000;
const STAR_SHIELD_WARNING_CRITICAL_MS = 1000;
const STAR_SHIELD_WARNING_FAST_CYCLE_MS = 280;
const STAR_SHIELD_WARNING_FAST_VISIBLE_MS = 105;
const STAR_SHIELD_WARNING_CRITICAL_CYCLE_MS = 170;
const STAR_SHIELD_WARNING_CRITICAL_VISIBLE_MS = 42;
const JUMP_VELOCITY = -520;
const MAX_JUMPS = 2;
const MOVE_SPEED = 120;
const FIRE_COOLDOWN = 220;
const CHARGE_TIME = 800;
const ATTACK_ANIMATION_LOCK = 260;
const MELEE_ATTACK_ANIMATION_LOCK = 150;
const BULLET_SPEED = 350;
const NOTE_BULLET_DAMAGE = 10;
const EXTRA_SHOT_START_CYCLE_LENGTH = 5;
const HERO_HITBOX_WIDTH = 54;
const HERO_HITBOX_HEIGHT = 160;
const HERO_HITBOX_OFFSET_X = 52;
const HERO_HITBOX_OFFSET_Y = 46;
const DRAGON_HITBOX_WIDTH = 22;
const DRAGON_HITBOX_HEIGHT = 75;
const DRAGON_HITBOX_OFFSET_X = 27;
const DRAGON_HITBOX_OFFSET_Y = 17;
const HERO_VISUAL_SCALE = 0.36;
const DRAGON_PLAYER_SOURCE_SCALE = 1.9875;
const DRAGON_PLAYER_SOURCE_PAD_X = 72.45;
const DRAGON_PLAYER_SOURCE_PAD_Y = 2.1;
const DRAGON_VISUAL_SCALE = 0.36;
const DRAGON_MELEE_BASE_RANGE = 54;
const DRAGON_MELEE_BASE_HEIGHT = 38;
const DRAGON_MELEE_RANGE_PER_POWER = 3;
const DRAGON_MELEE_HEIGHT_PER_POWER = 2;
const DRAGON_CHARGED_MELEE_BASE_RANGE = 68;
const DRAGON_CHARGED_MELEE_BASE_HEIGHT = 48;
const DRAGON_CHARGED_MELEE_RANGE_PER_POWER = 4;
const DRAGON_CHARGED_MELEE_HEIGHT_PER_POWER = 3;
const DRAGON_MELEE_HITBOX_ANCHOR_X = 30;
const DRAGON_MELEE_HITBOX_OFFSET_Y = -2;
const DRAGON_CLAW_SCRATCH_FRAME_WIDTH = 280;
const DRAGON_CLAW_VISIBLE_START_RATIO = 0.065;
const DRAGON_CLAW_VISIBLE_WIDTH_RATIO = 0.868;
const DRAGON_CLAW_VISIBLE_HEIGHT_TO_WIDTH_RATIO = 0.597;
const DRAGON_MELEE_EFFECT_GAP = 4;
const DRAGON_MELEE_EFFECT_VISIBLE_WIDTH_RATIO = 0.78;
const DRAGON_CHARGED_EFFECT_VISIBLE_WIDTH_RATIO = 0.68;
const DRAGON_CHARGED_SCRATCH_COUNT = 2;
const DRAGON_CHARGED_SCRATCH_DELAY = 64;
const DRAGON_CHARGED_CROSS_ANGLE = 32;

type AttackType = 'ranged' | 'melee';

interface PlayerCharacterProfile {
  textureKey: string;
  animPrefix: string;
  attackType: AttackType;
  visualScale: number;
  hitbox: PlayerHitbox;
  frameHitboxes?: Record<number, PlayerHitbox>;
  sourceFrame?: {
    scale: number;
    padX: number;
    padY: number;
  };
  shield: {
    shellWidth: number;
    shellHeight: number;
    shellOffsetY: number;
  };
}

interface PlayerHitbox {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

const HERO_FRAME_HITBOXES: Record<number, PlayerHitbox> = {
  18: {
    width: HERO_HITBOX_WIDTH,
    height: 136,
    offsetX: HERO_HITBOX_OFFSET_X,
    offsetY: 70,
  },
  19: {
    width: HERO_HITBOX_WIDTH,
    height: 136,
    offsetX: HERO_HITBOX_OFFSET_X,
    offsetY: 70,
  },
};

const DRAGON_FRAME_HITBOXES: Record<number, PlayerHitbox> = {
  0: { width: 22, height: 75, offsetX: 27, offsetY: 17 },
  1: { width: 22, height: 75, offsetX: 27, offsetY: 17 },
  2: { width: 22, height: 75, offsetX: 27, offsetY: 17 },
  3: { width: 22, height: 75, offsetX: 27, offsetY: 17 },
  4: { width: 22, height: 75, offsetX: 27, offsetY: 17 },
  5: { width: 22, height: 75, offsetX: 28, offsetY: 17 },
  6: { width: 22, height: 75, offsetX: 28, offsetY: 17 },
  7: { width: 22, height: 75, offsetX: 28, offsetY: 17 },
  8: { width: 22, height: 75, offsetX: 28, offsetY: 17 },
  9: { width: 22, height: 75, offsetX: 28, offsetY: 17 },
  10: { width: 22, height: 75, offsetX: 28, offsetY: 17 },
  11: { width: 22, height: 75, offsetX: 28, offsetY: 17 },
  12: { width: 22, height: 75, offsetX: 28, offsetY: 17 },
  13: { width: 22, height: 75, offsetX: 28, offsetY: 17 },
  14: { width: 22, height: 75, offsetX: 28, offsetY: 17 },
  15: { width: 22, height: 75, offsetX: 28, offsetY: 17 },
  16: { width: 22, height: 76, offsetX: 27, offsetY: 15 },
  17: { width: 22, height: 76, offsetX: 27, offsetY: 15 },
  18: { width: 24, height: 75, offsetX: 37, offsetY: 17 },
  19: { width: 24, height: 75, offsetX: 39, offsetY: 17 },
  20: { width: 24, height: 75, offsetX: 30, offsetY: 17 },
  21: { width: 24, height: 75, offsetX: 30, offsetY: 17 },
  22: { width: 24, height: 75, offsetX: 30, offsetY: 17 },
  23: { width: 24, height: 75, offsetX: 30, offsetY: 17 },
};

const PLAYER_CHARACTER_PROFILES: Record<
  PlayerCharacterId,
  PlayerCharacterProfile
> = {
  bride: {
    textureKey: 'hero',
    animPrefix: 'hero',
    attackType: 'ranged',
    visualScale: HERO_VISUAL_SCALE,
    hitbox: {
      width: HERO_HITBOX_WIDTH,
      height: HERO_HITBOX_HEIGHT,
      offsetX: HERO_HITBOX_OFFSET_X,
      offsetY: HERO_HITBOX_OFFSET_Y,
    },
    frameHitboxes: HERO_FRAME_HITBOXES,
    shield: {
      shellWidth: 82,
      shellHeight: 116,
      shellOffsetY: 0,
    },
  },
  dragon: {
    textureKey: 'dragon-player',
    animPrefix: 'dragon-player',
    attackType: 'melee',
    visualScale: DRAGON_VISUAL_SCALE,
    hitbox: {
      width: DRAGON_HITBOX_WIDTH,
      height: DRAGON_HITBOX_HEIGHT,
      offsetX: DRAGON_HITBOX_OFFSET_X,
      offsetY: DRAGON_HITBOX_OFFSET_Y,
    },
    frameHitboxes: DRAGON_FRAME_HITBOXES,
    sourceFrame: {
      scale: DRAGON_PLAYER_SOURCE_SCALE,
      padX: DRAGON_PLAYER_SOURCE_PAD_X,
      padY: DRAGON_PLAYER_SOURCE_PAD_Y,
    },
    shield: {
      shellWidth: 82,
      shellHeight: 116,
      shellOffsetY: 0,
    },
  },
};

export interface DamageResult {
  dead: boolean;
  droppedPowerups: number;
}

export type HeartCollectResult = 'hp-up' | 'score';

export const MOBILE_RANGED_AUTOFIRE_ENABLED = false;

export interface MeleeStrike {
  bounds: Phaser.Geom.Rectangle;
  damage: number;
  charged: boolean;
}

export interface PlayerCarryState {
  x: number;
  y: number;
  starTimer: number;
  isStarInvincible: boolean;
}

interface DebugMeleeStrike {
  bounds: Phaser.Geom.Rectangle;
  charged: boolean;
  expiresAt: number;
}

interface DebugClawEffect {
  bounds: Phaser.Geom.Rectangle;
  expiresAt: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp = runState.getSnapshot().hp;
  maxHp = runState.getSnapshot().maxHp;
  private jumpCount = 0;
  private isInvincible = false;
  private invincibleTimer = 0;
  private isStarInvincible = false;
  private starTimer = 0;
  private powerLevel = runState.getSnapshot().powerLevel;
  private invincibleShield: Phaser.GameObjects.Image;
  private chargeGlow: Phaser.GameObjects.Sprite;
  private auraTween: Phaser.Tweens.Tween | null = null;
  private chargeTween: Phaser.Tweens.Tween | null = null;
  private hitFlickerTween: Phaser.Tweens.Tween | null = null;
  private bulletPool: BulletPool | null = null;
  private isHoldingAttack = false;
  private isChargeReady = false;
  private holdStart = 0;
  private lastFireTime = 0;
  private normalShotSequence = 0;
  private attackAnimationUntil = 0;
  private autoFire = false;
  private meleeStrikes: MeleeStrike[] = [];
  private debugMeleeStrikes: DebugMeleeStrike[] = [];
  private debugClawEffects: DebugClawEffect[] = [];
  private profile: PlayerCharacterProfile;
  private characterId: PlayerCharacterId;
  private activeHitboxKey = '';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    characterId: PlayerCharacterId = 'bride',
  ) {
    const profile = PLAYER_CHARACTER_PROFILES[characterId];
    super(scene, x, y, profile.textureKey, 0);
    this.profile = profile;
    this.characterId = characterId;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setScale(profile.visualScale);
    this.applyHitbox(profile.hitbox);
    this.setFlipX(false);
    this.setDepth(5);

    this.invincibleShield = scene.add.image(x, y, 'player-shield').setDepth(6);
    this.invincibleShield.setVisible(false);
    this.invincibleShield.setBlendMode(Phaser.BlendModes.ADD);
    this.invincibleShield.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.chargeGlow = scene.add.sprite(x, y, profile.textureKey, 0);
    this.chargeGlow.setDepth(6);
    this.chargeGlow.setVisible(false);
    this.chargeGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.chargeGlow.setTint(
      profile.attackType === 'melee' ? 0xbdf7ff : 0xfff7df,
    );
  }

  setBulletPool(pool: BulletPool) {
    this.bulletPool = pool;
  }

  enableAutoFire() {
    if (this.profile.attackType === 'ranged') {
      this.autoFire = true;
    }
  }

  canAutoFire() {
    return this.profile.attackType === 'ranged';
  }

  consumeMeleeStrikes() {
    const strikes = this.meleeStrikes;
    this.meleeStrikes = [];
    return strikes;
  }

  getDebugMeleeStrikes() {
    return this.debugMeleeStrikes.map((strike) => ({
      bounds: strike.bounds,
      charged: strike.charged,
    }));
  }

  getDebugClawEffects() {
    return this.debugClawEffects.map((effect) => ({
      bounds: effect.bounds,
    }));
  }

  jump() {
    if (this.jumpCount < MAX_JUMPS) {
      this.setVelocityY(JUMP_VELOCITY);
      this.jumpCount++;
      this.playAnim('jump', true);
    }
  }

  cutJump() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y < JUMP_VELOCITY * 0.4) {
      body.velocity.y = JUMP_VELOCITY * 0.4;
    }
  }

  startAttack() {
    if (this.isHoldingAttack) return;
    this.isHoldingAttack = true;
    this.isChargeReady = false;
    this.holdStart = this.scene.time.now;
    this.stopChargeEffect();
    this.performAttack(false);
  }

  releaseAttack() {
    if (!this.isHoldingAttack) return;

    const holdTime = this.scene.time.now - this.holdStart;
    this.isHoldingAttack = false;
    if (this.isChargeReady || holdTime >= CHARGE_TIME) {
      this.performAttack(true);
    }
    this.isChargeReady = false;
    this.stopChargeEffect();
  }

  private performAttack(charged: boolean) {
    const now = this.scene.time.now;
    if (now - this.lastFireTime < FIRE_COOLDOWN && !charged) return;
    this.lastFireTime = now;
    if (!this.autoFire || charged || this.profile.attackType === 'melee') {
      this.attackAnimationUntil =
        now +
        (this.profile.attackType === 'melee'
          ? MELEE_ATTACK_ANIMATION_LOCK
          : ATTACK_ANIMATION_LOCK);
      this.playAnim('attack', true);
    }

    if (this.profile.attackType === 'melee') {
      this.fireMeleeStrike(charged);
      return;
    }

    if (!this.bulletPool) return;
    const damage = charged ? this.getChargeShotDamage() : NOTE_BULLET_DAMAGE;
    const speed = BULLET_SPEED;
    this.firePattern(speed, damage, charged);
    this.spawnShotFlash(charged);
  }

  private fireMeleeStrike(charged: boolean) {
    const { range, height } = this.getMeleeDimensions(charged);
    const powerMultiplier =
      1 + this.powerLevel * CHARGE_POWER_LEVEL_DAMAGE_MULTIPLIER;
    const damage = (charged ? 40 : 20) * powerMultiplier;
    const visibleWidth =
      range *
      (charged
        ? DRAGON_CHARGED_EFFECT_VISIBLE_WIDTH_RATIO
        : DRAGON_MELEE_EFFECT_VISIBLE_WIDTH_RATIO);
    const visibleHeight = Math.min(
      height,
      visibleWidth * DRAGON_CLAW_VISIBLE_HEIGHT_TO_WIDTH_RATIO,
    );
    const hitboxSize = charged
      ? this.getRotatedMeleeHitboxSize(
          visibleWidth,
          visibleHeight,
          DRAGON_CHARGED_CROSS_ANGLE,
        )
      : { width: visibleWidth, height: visibleHeight };
    const startX = this.x + DRAGON_MELEE_HITBOX_ANCHOR_X;
    const baseBounds = new Phaser.Geom.Rectangle(
      startX,
      this.y -
        hitboxSize.height / 2 +
        (charged ? 0 : DRAGON_MELEE_HITBOX_OFFSET_Y),
      hitboxSize.width,
      hitboxSize.height,
    );
    const effectDisplayWidth = visibleWidth / DRAGON_CLAW_VISIBLE_WIDTH_RATIO;
    const scratchCount = charged ? DRAGON_CHARGED_SCRATCH_COUNT : 1;
    const strikeDamage = damage / scratchCount;
    this.meleeStrikes = [];

    for (let scratchIndex = 0; scratchIndex < scratchCount; scratchIndex++) {
      const bounds = baseBounds;
      const delay = charged ? scratchIndex * DRAGON_CHARGED_SCRATCH_DELAY : 0;
      this.queueMeleeStrike(bounds, strikeDamage, charged, delay);
      this.spawnClawEffect(
        bounds,
        charged,
        delay,
        scratchIndex,
        effectDisplayWidth,
      );
    }
  }

  private getRotatedMeleeHitboxSize(
    width: number,
    height: number,
    angleDegrees: number,
  ) {
    const angle = Phaser.Math.DegToRad(angleDegrees);
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    return {
      width: width * cos + height * sin,
      height: width * sin + height * cos,
    };
  }

  private queueMeleeStrike(
    bounds: Phaser.Geom.Rectangle,
    damage: number,
    charged: boolean,
    delay: number,
  ) {
    const queueStrike = () => {
      const strike = { bounds, damage, charged };
      this.meleeStrikes.push(strike);
      this.debugMeleeStrikes.push({
        bounds,
        charged,
        expiresAt: this.scene.time.now + (charged ? 180 : 150),
      });
    };

    if (delay <= 0) {
      queueStrike();
      return;
    }

    this.scene.time.delayedCall(delay, queueStrike);
  }

  private getMeleeDimensions(charged: boolean) {
    if (charged) {
      return {
        range:
          DRAGON_CHARGED_MELEE_BASE_RANGE +
          this.powerLevel * DRAGON_CHARGED_MELEE_RANGE_PER_POWER,
        height:
          DRAGON_CHARGED_MELEE_BASE_HEIGHT +
          this.powerLevel * DRAGON_CHARGED_MELEE_HEIGHT_PER_POWER,
      };
    }

    return {
      range:
        DRAGON_MELEE_BASE_RANGE +
        this.powerLevel * DRAGON_MELEE_RANGE_PER_POWER,
      height:
        DRAGON_MELEE_BASE_HEIGHT +
        this.powerLevel * DRAGON_MELEE_HEIGHT_PER_POWER,
    };
  }

  private spawnShotFlash(charged: boolean) {
    const flash = this.scene.add.circle(
      this.x + 24,
      this.y,
      charged ? 10 : 5,
      0xffd700,
      0.7,
    );
    flash.setDepth(6);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 0.2,
      duration: 100,
      onComplete: () => flash.destroy(),
    });

    if (charged) {
      const burst = this.scene.add.circle(this.x + 24, this.y, 12, 0xffe08a, 0);
      burst.setDepth(6);
      burst.setStrokeStyle(3, 0xffe08a, 0.9);
      this.scene.tweens.add({
        targets: burst,
        alpha: { from: 0.9, to: 0 },
        scale: { from: 0.7, to: 2.2 },
        duration: 220,
        ease: 'Cubic.easeOut',
        onComplete: () => burst.destroy(),
      });
    }
  }

  private spawnClawEffect(
    bounds: Phaser.Geom.Rectangle,
    charged: boolean,
    delay: number,
    scratchIndex: number,
    effectDisplayWidth: number,
  ) {
    const drawEffect = () => {
      const scale = effectDisplayWidth / DRAGON_CLAW_SCRATCH_FRAME_WIDTH;
      const effectX = charged
        ? bounds.centerX
        : bounds.x +
          DRAGON_MELEE_EFFECT_GAP -
          effectDisplayWidth * DRAGON_CLAW_VISIBLE_START_RATIO;
      const effect = this.scene.add
        .sprite(effectX, bounds.centerY, 'dragon-claw-scratch')
        .setOrigin(charged ? 0.5 : 0, 0.5)
        .setDepth(8)
        .setBlendMode(Phaser.BlendModes.ADD);

      effect.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      effect.setScale(scale);
      if (charged) {
        effect.setAngle(
          scratchIndex === 0
            ? -DRAGON_CHARGED_CROSS_ANGLE
            : DRAGON_CHARGED_CROSS_ANGLE,
        );
        effect.setFlipY(scratchIndex % 2 === 1);
      }
      this.debugClawEffects.push({
        bounds,
        expiresAt: this.scene.time.now + 190,
      });
      effect.play('dragon-claw-scratch-anim');
      effect.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () =>
        effect.destroy(),
      );
    };

    if (delay <= 0) {
      drawEffect();
      return;
    }

    this.scene.time.delayedCall(delay, drawEffect);
  }

  takeDamage(): DamageResult {
    if (this.isInvincible || this.isStarInvincible) {
      return { dead: false, droppedPowerups: 0 };
    }

    const difficulty = getDifficultyConfig();
    const droppedPowerups = difficulty.dropPowerupsOnHit && this.powerLevel > 0 ? 1 : 0;
    if (difficulty.dropPowerupsOnHit) {
      this.powerLevel = Math.max(this.powerLevel - 1, 0);
      runState.setPowerLevel(this.powerLevel);
    }
    this.hp--;
    runState.setHp(this.hp);
    scoreManager.penalizeHit();
    this.attackAnimationUntil = 0;
    this.playAnim('hurt', true);
    this.isInvincible = true;
    this.invincibleTimer = INVINCIBLE_DURATION;
    this.startDamageFlicker();

    return {
      dead: this.hp <= 0,
      droppedPowerups,
    };
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    runState.setHp(this.hp);
  }

  collectHeart(): HeartCollectResult {
    if (this.maxHp < RUN_MAX_HP_CAP) {
      this.maxHp += 1;
      this.hp = Math.min(this.maxHp, this.hp + 1);
      runState.setMaxHp(this.maxHp);
      runState.setHp(this.hp);
      return 'hp-up';
    }

    if (this.hp < this.maxHp) {
      this.heal(1);
      return 'hp-up';
    }

    return 'score';
  }

  activateStar(duration: number) {
    this.isStarInvincible = true;
    this.starTimer = duration;
    this.startInvincibleOutline();
  }

  getCarryState(): PlayerCarryState {
    return {
      x: this.x,
      y: this.y,
      starTimer: this.starTimer,
      isStarInvincible: this.isStarInvincible,
    };
  }

  applyCarryState(state?: PlayerCarryState) {
    if (!state) return;
    this.setPosition(state.x, state.y);
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    }
    if (state.isStarInvincible && state.starTimer > 0) {
      this.activateStar(state.starTimer);
    }
  }

  activatePowerUp(duration: number) {
    if (this.powerLevel >= POWERUP_MAX_LEVEL) return false;
    this.powerLevel = Math.min(this.powerLevel + duration, POWERUP_MAX_LEVEL);
    runState.setPowerLevel(this.powerLevel);
    return true;
  }

  getPowerLevel() {
    return this.powerLevel;
  }

  getPowerDisplayCount() {
    return this.powerLevel + 1;
  }

  getCharacterId() {
    return this.characterId;
  }

  isInvincibleState() {
    return this.isInvincible || this.isStarInvincible;
  }

  getShieldHitBounds() {
    if (!this.isStarInvincible) return null;
    const { shellWidth, shellHeight, shellOffsetY } = this.profile.shield;
    const width = shellWidth * 0.82;
    const height = shellHeight * 0.84;
    return new Phaser.Geom.Rectangle(
      this.x - width / 2,
      this.y + shellOffsetY - height / 2,
      width,
      height,
    );
  }

  moveLeft() {
    this.setVelocityX(-MOVE_SPEED);
    this.setFlipX(false);
  }

  moveRight() {
    this.setVelocityX(MOVE_SPEED);
    this.setFlipX(false);
  }

  stopMove() {
    this.setVelocityX(0);
  }

  update(_time: number, delta: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const isGrounded = body.blocked.down && body.velocity.y >= 0;
    if (isGrounded) {
      this.jumpCount = 0;
      if (this.isChargeReady) {
        this.playAnim('charge', true);
      } else if (!this.isActionAnimationLocked()) {
        if (Math.abs(body.velocity.x) > 10) {
          this.playAnim('run', true);
        } else {
          this.playAnim('idle', true);
        }
      }
    }

    if (this.autoFire && !this.isHoldingAttack) {
      this.performAttack(false);
    } else if (this.isHoldingAttack) {
      const holdTime = this.scene.time.now - this.holdStart;
      if (holdTime >= CHARGE_TIME) {
        if (!this.isChargeReady) {
          this.isChargeReady = true;
          this.playAnim(isGrounded ? 'charge' : 'jump', true);
          this.startChargeEffect();
        } else if (
          !isGrounded &&
          this.scene.time.now >= this.attackAnimationUntil
        ) {
          this.playAnim('jump', true);
        }
      }
    } else if (
      !isGrounded &&
      this.isChargeReady &&
      this.scene.time.now >= this.attackAnimationUntil
    ) {
      this.playAnim('jump', true);
    }

    if (this.isInvincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.stopDamageFlicker();
      }
    }

    if (this.isStarInvincible) {
      this.starTimer -= delta;
      if (this.starTimer <= 0) {
        this.isStarInvincible = false;
        this.stopInvincibleOutline();
      } else {
        this.updateShieldWarningBlink();
      }
    }

    this.debugMeleeStrikes = this.debugMeleeStrikes.filter(
      (strike) => strike.expiresAt > this.scene.time.now,
    );
    this.debugClawEffects = this.debugClawEffects.filter(
      (effect) => effect.expiresAt > this.scene.time.now,
    );
    this.syncEffects();
    this.applyCurrentFrameHitbox();
    this.x = Phaser.Math.Clamp(this.x, 16, GAME_WIDTH - 16);
  }

  private firePattern(speed: number, damage: number, charged: boolean) {
    const bulletPool = this.bulletPool;
    if (!bulletPool) return;

    if (charged) {
      bulletPool.fire(
        this.x + 16,
        this.y,
        speed,
        0,
        true,
        damage,
        true,
        undefined,
        this.powerLevel,
      );
      return;
    }

    const pattern = POWERUP_SHOT_PATTERNS[this.powerLevel];
    const shotSequence = this.normalShotSequence;
    this.normalShotSequence += 1;

    pattern.angles.forEach((angle, index) => {
      const isBaseShot = index === 0;
      const extraShotIndex = index - 1;
      const extraShotCycleLength = Math.max(
        1,
        EXTRA_SHOT_START_CYCLE_LENGTH - (this.powerLevel - extraShotIndex - 1),
      );
      if (
        !isBaseShot &&
        shotSequence % extraShotCycleLength !==
          extraShotIndex % extraShotCycleLength
      )
        return;
      bulletPool.fire(
        this.x + 16,
        this.y,
        Math.cos(angle) * speed,
        -Math.sin(angle) * speed,
        true,
        damage,
        false,
      );
    });
  }

  private getChargeShotDamage() {
    return (
      CHARGE_DAMAGE_MULTIPLIER *
      (1 + this.powerLevel * CHARGE_POWER_LEVEL_DAMAGE_MULTIPLIER)
    );
  }

  private playAnim(
    key: 'idle' | 'run' | 'jump' | 'attack' | 'hurt' | 'charge',
    ignoreIfPlaying = false,
  ) {
    this.play(`${this.profile.animPrefix}-${key}`, ignoreIfPlaying);
  }

  private isActionAnimationLocked() {
    return (
      this.isChargeReady || this.scene.time.now < this.attackAnimationUntil
    );
  }

  private applyCurrentFrameHitbox() {
    const frameIndex =
      typeof this.frame.name === 'number'
        ? this.frame.name
        : Number.parseInt(String(this.frame.name), 10);
    const hitbox =
      this.profile.frameHitboxes?.[frameIndex] ?? this.profile.hitbox;
    this.applyHitbox(hitbox);
  }

  private applyHitbox(hitbox: PlayerHitbox) {
    const sourceFrame = this.profile.sourceFrame;
    const appliedHitbox = sourceFrame
      ? {
          width: Math.round(hitbox.width * sourceFrame.scale),
          height: Math.round(hitbox.height * sourceFrame.scale),
          offsetX: Math.round(
            sourceFrame.padX + hitbox.offsetX * sourceFrame.scale,
          ),
          offsetY: Math.round(
            sourceFrame.padY + hitbox.offsetY * sourceFrame.scale,
          ),
        }
      : hitbox;
    const key = `${appliedHitbox.width}:${appliedHitbox.height}:${appliedHitbox.offsetX}:${appliedHitbox.offsetY}`;
    if (key === this.activeHitboxKey) return;
    this.activeHitboxKey = key;
    this.setSize(appliedHitbox.width, appliedHitbox.height);
    this.setOffset(appliedHitbox.offsetX, appliedHitbox.offsetY);
  }

  override destroy(fromScene?: boolean) {
    this.auraTween?.destroy();
    this.chargeTween?.destroy();
    this.hitFlickerTween?.destroy();
    this.invincibleShield.destroy();
    this.chargeGlow.destroy();
    super.destroy(fromScene);
  }

  private startDamageFlicker() {
    if (this.hitFlickerTween) return;

    this.setAlpha(1);
    this.hitFlickerTween = this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.3 },
      duration: 90,
      yoyo: true,
      repeat: -1,
    });
  }

  private stopDamageFlicker() {
    this.hitFlickerTween?.destroy();
    this.hitFlickerTween = null;
    this.setAlpha(1);
  }

  private startInvincibleOutline() {
    if (this.auraTween) return;

    this.invincibleShield.setVisible(true);
    this.invincibleShield.setAlpha(0.72);
    this.auraTween = this.scene.tweens.add({
      targets: this.invincibleShield,
      alpha: { from: 0.72, to: 0.42 },
      duration: 240,
      yoyo: true,
      repeat: -1,
    });
    this.updateShieldWarningBlink();
  }

  private stopInvincibleOutline() {
    this.auraTween?.destroy();
    this.auraTween = null;
    this.invincibleShield.setVisible(false);
    this.invincibleShield.setAlpha(1);
  }

  private updateShieldWarningBlink() {
    if (!this.auraTween) return;
    if (this.starTimer <= STAR_SHIELD_WARNING_CRITICAL_MS) {
      this.auraTween.pause();
      this.applyShieldWarningBlink(
        STAR_SHIELD_WARNING_CRITICAL_CYCLE_MS,
        STAR_SHIELD_WARNING_CRITICAL_VISIBLE_MS,
        0.9,
      );
    } else if (this.starTimer <= STAR_SHIELD_WARNING_FAST_MS) {
      this.auraTween.pause();
      this.applyShieldWarningBlink(
        STAR_SHIELD_WARNING_FAST_CYCLE_MS,
        STAR_SHIELD_WARNING_FAST_VISIBLE_MS,
        0.78,
      );
    } else {
      if (this.auraTween.isPaused()) this.auraTween.resume();
      this.auraTween.timeScale = 1;
      this.invincibleShield.setVisible(true);
    }
  }

  private applyShieldWarningBlink(
    cycleMs: number,
    visibleMs: number,
    visibleAlpha: number,
  ) {
    const isVisible = this.scene.time.now % cycleMs < visibleMs;
    this.invincibleShield.setVisible(isVisible);
    this.invincibleShield.setAlpha(isVisible ? visibleAlpha : 0);
  }

  private startChargeEffect() {
    if (this.chargeTween) return;

    this.chargeGlow.setVisible(true);
    this.chargeGlow.setAlpha(0.16);
    this.chargeTween = this.scene.tweens.add({
      targets: this.chargeGlow,
      alpha: { from: 0.16, to: 0.58 },
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopChargeEffect() {
    this.chargeTween?.destroy();
    this.chargeTween = null;
    this.chargeGlow.setVisible(false);
    this.chargeGlow.setAlpha(0);
  }

  private syncEffects() {
    this.invincibleShield
      .setPosition(this.x, this.y + this.profile.shield.shellOffsetY)
      .setDisplaySize(
        this.profile.shield.shellWidth,
        this.profile.shield.shellHeight,
      );

    this.chargeGlow
      .setPosition(this.x, this.y)
      .setFlipX(this.flipX)
      .setScale(this.scaleX * 1.02, this.scaleY * 1.02)
      .setTexture(this.texture.key, this.frame.name);
  }
}
