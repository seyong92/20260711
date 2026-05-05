export type DifficultyId = 'easy' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  description: string;
  startHp: number;
  startMaxHp: number;
  dropPowerupsOnHit: boolean;
  bossHpMultiplier: number;
  bossCooldownMultiplier: number;
  bossItemSequence: string[];
  cameraShotCount: number;
  pianoBouquetBurstCount: number;
  scoreMultiplier: number;
}

const EASY_BOSS_ITEM_SEQUENCE = [
  'heart',
  'powerup',
  'heart',
  'star',
  'heart',
  'coin',
];
const HARD_BOSS_ITEM_SEQUENCE = ['heart', 'powerup', 'star', 'coin'];

export const DIFFICULTY_CONFIGS: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'EASY',
    description: 'HP 5 / 파워업 드랍 없음',
    startHp: 5,
    startMaxHp: 5,
    dropPowerupsOnHit: false,
    bossHpMultiplier: 1,
    bossCooldownMultiplier: 1,
    bossItemSequence: [...EASY_BOSS_ITEM_SEQUENCE, 'heart', 'star'],
    cameraShotCount: 1,
    pianoBouquetBurstCount: 1,
    scoreMultiplier: 1,
  },
  hard: {
    id: 'hard',
    label: 'HARD',
    description: '강화된 스테이지 / 보스 패턴',
    startHp: 3,
    startMaxHp: 3,
    dropPowerupsOnHit: true,
    bossHpMultiplier: 1.5,
    bossCooldownMultiplier: 0.8,
    bossItemSequence: HARD_BOSS_ITEM_SEQUENCE,
    cameraShotCount: 1,
    pianoBouquetBurstCount: 2,
    scoreMultiplier: 1.5,
  },
};

let selectedDifficultyId: DifficultyId = 'easy';
const difficultyGlobalState = globalThis as typeof globalThis & {
  __weddingDifficultyId?: DifficultyId;
};

export function setSelectedDifficulty(id: DifficultyId) {
  selectedDifficultyId = id;
  difficultyGlobalState.__weddingDifficultyId = id;
}

export function getSelectedDifficultyId() {
  return difficultyGlobalState.__weddingDifficultyId ?? selectedDifficultyId;
}

export function getDifficultyConfig(id: DifficultyId = getSelectedDifficultyId()) {
  return DIFFICULTY_CONFIGS[id];
}

export function scaleDifficultyCooldown(value: number) {
  return Math.round(value * getDifficultyConfig().bossCooldownMultiplier);
}

export function scaleDifficultyBossHp(value: number) {
  return Math.round(value * getDifficultyConfig().bossHpMultiplier);
}
