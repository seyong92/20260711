export interface BossPhase {
  hpThreshold: number;
  patterns: string[];
  bulletSpeed: number;
  attackInterval: number;
}

export interface BossConfig {
  type: string;
  textureKey: string;
  hp: number;
  scoreValue: number;
  phases: BossPhase[];
  clearText: string;
}

export const BOSS_CONFIGS: Record<string, BossConfig> = {
  train: {
    type: 'train',
    textureKey: 'boss-train',
    hp: 400,
    scoreValue: 3000,
    phases: [
      {
        hpThreshold: 1.0,
        patterns: ['window-shots', 'headlight-sweep', 'radial-burst'],
        bulletSpeed: 120,
        attackInterval: 1875,
      },
      {
        hpThreshold: 0.62,
        patterns: ['window-shots', 'headlight-sweep', 'radial-burst'],
        bulletSpeed: 140,
        attackInterval: 1680,
      },
      {
        hpThreshold: 0.28,
        patterns: ['window-shots', 'headlight-sweep', 'radial-burst'],
        bulletSpeed: 160,
        attackInterval: 1380,
      },
    ],
    clearText: '멀리 있어도 결국 만난다!',
  },
  thesis: {
    type: 'thesis',
    textureKey: 'boss-thesis',
    hp: 550,
    scoreValue: 3000,
    phases: [
      {
        hpThreshold: 1.0,
        patterns: ['book-burst', 'paper-drizzle'],
        bulletSpeed: 108,
        attackInterval: 1450,
      },
      {
        hpThreshold: 0.62,
        patterns: [
          'book-burst',
          'paper-drizzle',
          'research-wave',
          'homing-orbit',
        ],
        bulletSpeed: 122,
        attackInterval: 1260,
      },
      {
        hpThreshold: 0.26,
        patterns: [
          'book-burst',
          'research-wave',
          'orbit-spread',
          'homing-orbit',
          'doctor-defense',
        ],
        bulletSpeed: 136,
        attackInterval: 1120,
      },
    ],
    clearText: '졸업을 축하합니다!',
  },
  piano: {
    type: 'piano',
    textureKey: 'boss-piano',
    hp: 800,
    scoreValue: 3000,
    phases: [
      {
        hpThreshold: 1.0,
        patterns: ['key-wave', 'note-fan'],
        bulletSpeed: 118,
        attackInterval: 2250,
      },
      {
        hpThreshold: 0.7,
        patterns: ['key-wave', 'note-fan', 'grand-recital'],
        bulletSpeed: 138,
        attackInterval: 2175,
      },
      {
        hpThreshold: 0.42,
        patterns: [
          'key-wave',
          'note-fan',
          'crescendo-drop',
          'grand-recital',
          'grand-recital',
        ],
        bulletSpeed: 156,
        attackInterval: 2070,
      },
      {
        hpThreshold: 0.25,
        patterns: [
          'key-wave',
          'note-fan',
          'crescendo-drop',
          'grand-recital',
          'grand-recital',
          'bouquet-shot',
          'bouquet-shot',
        ],
        bulletSpeed: 166,
        attackInterval: 1875,
      },
    ],
    clearText: '결혼 준비 완료!',
  },
};
