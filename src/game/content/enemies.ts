import { getDifficultyConfig, type DifficultyId } from './difficulty';

export type EnemyBulletPattern =
  | 'aimed'
  | 'aimed-spread'
  | 'aimed-burst'
  | 'rain'
  | 'telegraph-beam'
  | 'wobble'
  | 'curved-fan'
  | 'paper-semicircle';

export interface EnemyConfig {
  type: string;
  frame: number;
  hp: number;
  speed: number;
  scoreValue: number;
  bulletPattern: EnemyBulletPattern;
  bulletSpeed: number;
  shotCount: number;
  shotInterval: number;
  attackDuration: number;
  particleTint: number;
  moveStyle: 'swoop' | 'dive' | 'hover' | 'strafe' | 'kamikaze';
}

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  book: {
    type: 'book',
    frame: 0,
    hp: 40,
    speed: 84,
    scoreValue: 100,
    bulletPattern: 'aimed',
    bulletSpeed: 125,
    shotCount: 1,
    shotInterval: 760,
    attackDuration: 1600,
    particleTint: 0xcbb38d,
    moveStyle: 'swoop',
  },
  phone: {
    type: 'phone',
    frame: 1,
    hp: 20,
    speed: 126,
    scoreValue: 110,
    bulletPattern: 'aimed-burst',
    bulletSpeed: 145,
    shotCount: 2,
    shotInterval: 390,
    attackDuration: 820,
    particleTint: 0xf0a7b8,
    moveStyle: 'dive',
  },
  invitation: {
    type: 'invitation',
    frame: 2,
    hp: 50,
    speed: 95,
    scoreValue: 120,
    bulletPattern: 'aimed-spread',
    bulletSpeed: 125,
    shotCount: 2,
    shotInterval: 860,
    attackDuration: 2100,
    particleTint: 0xf3f0e6,
    moveStyle: 'hover',
  },
  camera: {
    type: 'camera',
    frame: 3,
    hp: 30,
    speed: 72,
    scoreValue: 150,
    bulletPattern: 'telegraph-beam',
    bulletSpeed: 150,
    shotCount: 1,
    shotInterval: 1300,
    attackDuration: 4200,
    particleTint: 0x8fb7d7,
    moveStyle: 'strafe',
  },
  cap: {
    type: 'cap',
    frame: 4,
    hp: 30,
    speed: 88,
    scoreValue: 130,
    bulletPattern: 'wobble',
    bulletSpeed: 138,
    shotCount: 0,
    shotInterval: 720,
    attackDuration: 2300,
    particleTint: 0x1f2c61,
    moveStyle: 'kamikaze',
  },
  'thesis-paper': {
    type: 'thesis-paper',
    frame: 5,
    hp: 40,
    speed: 90,
    scoreValue: 150,
    bulletPattern: 'paper-semicircle',
    bulletSpeed: 136,
    shotCount: 2,
    shotInterval: 860,
    attackDuration: 2200,
    particleTint: 0xe8d3be,
    moveStyle: 'hover',
  },
};

export function getEnemyConfig(type: string, difficultyId?: DifficultyId) {
  const config = ENEMY_CONFIGS[type];
  if (!config) return undefined;

  const difficulty = getDifficultyConfig(difficultyId);
  if (type === 'camera' && config.shotCount !== difficulty.cameraShotCount) {
    return {
      ...config,
      shotCount: difficulty.cameraShotCount,
    };
  }

  return config;
}
