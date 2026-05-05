export interface ItemConfig {
  type: string;
  frame: number;
  effect: 'heal' | 'invincible' | 'powerup' | 'score';
  value: number;
}

export interface ShotPatternConfig {
  angles: number[];
}

const NOTE_SHOT_ANGLE_STEP = (Math.PI * 5) / 48;

export const POWERUP_SHOT_PATTERNS: ShotPatternConfig[] = [
  { angles: [0] },
  { angles: [0, NOTE_SHOT_ANGLE_STEP] },
  { angles: [0, NOTE_SHOT_ANGLE_STEP, NOTE_SHOT_ANGLE_STEP * 2] },
  {
    angles: [
      0,
      NOTE_SHOT_ANGLE_STEP,
      NOTE_SHOT_ANGLE_STEP * 2,
      NOTE_SHOT_ANGLE_STEP * 3,
    ],
  },
  {
    angles: [
      0,
      NOTE_SHOT_ANGLE_STEP,
      NOTE_SHOT_ANGLE_STEP * 2,
      NOTE_SHOT_ANGLE_STEP * 3,
      NOTE_SHOT_ANGLE_STEP * 4,
    ],
  },
];

export const POWERUP_MAX_LEVEL = POWERUP_SHOT_PATTERNS.length - 1;
export const CHARGE_DAMAGE_MULTIPLIER = 30;
export const CHARGE_POWER_LEVEL_DAMAGE_MULTIPLIER = 0.25;

export const ITEM_CONFIGS: Record<string, ItemConfig> = {
  heart: {
    type: 'heart',
    frame: 0,
    effect: 'heal',
    value: 1,
  },
  star: {
    type: 'star',
    frame: 1,
    effect: 'invincible',
    value: 5000,
  },
  powerup: {
    type: 'powerup',
    frame: 2,
    effect: 'powerup',
    value: 1,
  },
  coin: {
    type: 'coin',
    frame: 3,
    effect: 'score',
    value: 500,
  },
};
