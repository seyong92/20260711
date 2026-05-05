import { ENEMY_CONFIGS } from './enemies'
import { getSelectedDifficultyId, type DifficultyId } from './difficulty'

export interface SpawnEvent {
  time: number
  spawnId: string
  enemyType: string
  x: number
  y: number
  dropItem?: string
  patternOverride?: string
  shotCountOverride?: number
}

export interface StageConfig {
  id: number
  name: string
  bgKey: string
  bossBgKey?: string
  textTheme: 'dark' | 'light'
  scrollSpeed: number
  duration: number
  bossType: string
  spawns: SpawnEvent[]
}

const Y_SLOTS: Record<string, number[]> = {
  swoop: [190, 235, 285, 330],
  dive: [88, 128, 168, 208],
  hover: [240, 285, 330, 370],
  strafe: [142, 184, 226, 268],
  kamikaze: [126, 158, 196, 238, 292, 332],
}
const Y_BOUNDS: Record<string, { min: number; max: number }> = {
  swoop: { min: 170, max: 350 },
  dive: { min: 78, max: 226 },
  hover: { min: 224, max: 390 },
  strafe: { min: 136, max: 280 },
  kamikaze: { min: 120, max: 340 },
}
const Y_VARIATIONS = [-24, -14, 0, 18, 28, 8, -8, 22]
type WaveSpawn = { enemyType: string; dropItem?: string; patternOverride?: string; shotCountOverride?: number }

function getSpawnY(type: string, index: number, seed: number) {
  const style = ENEMY_CONFIGS[type]?.moveStyle ?? 'swoop'
  const slots = Y_SLOTS[style]
  const base = slots[index % slots.length]
  const variation = Y_VARIATIONS[(index * 3 + seed) % Y_VARIATIONS.length]
  const bounds = Y_BOUNDS[style]
  return Math.max(bounds.min, Math.min(bounds.max, base + variation))
}

const STAGE_WAVES: Array<Array<Array<WaveSpawn>>> = [
  [
    [{ enemyType: 'book', dropItem: 'coin' }, { enemyType: 'phone', dropItem: 'powerup' }, { enemyType: 'book' }],
    [
      { enemyType: 'phone', dropItem: 'heart' },
      { enemyType: 'book', dropItem: 'powerup' },
      { enemyType: 'phone' },
    ],
    [
      { enemyType: 'book', dropItem: 'coin' },
      { enemyType: 'phone' },
      { enemyType: 'book', dropItem: 'heart' },
    ],
    [
      { enemyType: 'phone', patternOverride: 'aimed-burst' },
      { enemyType: 'phone', dropItem: 'heart' },
      { enemyType: 'book' },
      { enemyType: 'phone', dropItem: 'star' },
    ],
  ],
  [
    [
      { enemyType: 'book', dropItem: 'coin' },
      { enemyType: 'cap' },
      { enemyType: 'thesis-paper', dropItem: 'coin' },
      { enemyType: 'book', dropItem: 'coin' },
      { enemyType: 'thesis-paper' },
    ],
    [
      { enemyType: 'cap', dropItem: 'heart' },
      { enemyType: 'thesis-paper' },
      { enemyType: 'cap', dropItem: 'powerup' },
    ],
    [
      { enemyType: 'book' },
      { enemyType: 'thesis-paper', dropItem: 'powerup' },
      { enemyType: 'cap' },
      { enemyType: 'thesis-paper', dropItem: 'heart' },
    ],
    [
      { enemyType: 'cap' },
      { enemyType: 'thesis-paper' },
      { enemyType: 'cap' },
      { enemyType: 'book', dropItem: 'star' },
      { enemyType: 'cap' },
    ],
  ],
  [
    [
      { enemyType: 'book', dropItem: 'coin' },
      { enemyType: 'invitation' },
      { enemyType: 'book', dropItem: 'coin' },
      { enemyType: 'invitation' },
    ],
    [
      { enemyType: 'camera', dropItem: 'heart' },
      { enemyType: 'invitation', dropItem: 'powerup' },
      { enemyType: 'book' },
      { enemyType: 'camera' },
      { enemyType: 'invitation' },
    ],
    [
      { enemyType: 'invitation' },
      { enemyType: 'camera', dropItem: 'powerup' },
      { enemyType: 'camera' },
      { enemyType: 'invitation' },
    ],
    [
      { enemyType: 'camera' },
      { enemyType: 'invitation' },
      { enemyType: 'camera', dropItem: 'star' },
      { enemyType: 'invitation' },
      { enemyType: 'book' },
      { enemyType: 'camera' },
    ],
  ],
]

const HARD_STAGE_WAVES: Array<Array<Array<WaveSpawn>>> = [
  [
    [
      { enemyType: 'book', dropItem: 'coin' },
      { enemyType: 'phone', dropItem: 'powerup' },
      { enemyType: 'book' },
      { enemyType: 'phone' },
    ],
    [
      { enemyType: 'phone', dropItem: 'heart' },
      { enemyType: 'book', dropItem: 'powerup' },
      { enemyType: 'phone' },
      { enemyType: 'book' },
    ],
    [
      { enemyType: 'book', dropItem: 'coin' },
      { enemyType: 'phone' },
      { enemyType: 'book', dropItem: 'heart' },
      { enemyType: 'phone', patternOverride: 'aimed-burst' },
      { enemyType: 'book' },
    ],
    [
      { enemyType: 'phone', dropItem: 'heart' },
      { enemyType: 'book' },
      { enemyType: 'phone' },
      { enemyType: 'book', dropItem: 'coin' },
      { enemyType: 'phone', dropItem: 'star' },
    ],
  ],
  [
    [
      { enemyType: 'book', dropItem: 'coin' },
      { enemyType: 'cap' },
      { enemyType: 'thesis-paper', dropItem: 'coin' },
      { enemyType: 'book' },
      { enemyType: 'thesis-paper' },
      { enemyType: 'cap' },
    ],
    [
      { enemyType: 'cap', dropItem: 'heart' },
      { enemyType: 'thesis-paper' },
      { enemyType: 'cap', dropItem: 'powerup' },
      { enemyType: 'book' },
      { enemyType: 'thesis-paper' },
    ],
    [
      { enemyType: 'book' },
      { enemyType: 'thesis-paper', dropItem: 'powerup' },
      { enemyType: 'cap' },
      { enemyType: 'thesis-paper', dropItem: 'heart' },
      { enemyType: 'cap' },
      { enemyType: 'thesis-paper' },
    ],
    [
      { enemyType: 'cap' },
      { enemyType: 'thesis-paper' },
      { enemyType: 'cap' },
      { enemyType: 'book', dropItem: 'star' },
      { enemyType: 'cap' },
      { enemyType: 'thesis-paper' },
    ],
  ],
  [
    [
      { enemyType: 'book', dropItem: 'coin' },
      { enemyType: 'invitation' },
      { enemyType: 'book', dropItem: 'coin' },
      { enemyType: 'invitation' },
      { enemyType: 'camera', shotCountOverride: 2 },
    ],
    [
      { enemyType: 'camera', dropItem: 'heart' },
      { enemyType: 'invitation', dropItem: 'powerup' },
      { enemyType: 'book' },
      { enemyType: 'camera', shotCountOverride: 2 },
      { enemyType: 'invitation' },
      { enemyType: 'camera' },
    ],
    [
      { enemyType: 'invitation' },
      { enemyType: 'camera', dropItem: 'powerup', shotCountOverride: 2 },
      { enemyType: 'camera' },
      { enemyType: 'invitation' },
      { enemyType: 'book' },
      { enemyType: 'camera' },
    ],
    [
      { enemyType: 'camera' },
      { enemyType: 'invitation' },
      { enemyType: 'camera', dropItem: 'star', shotCountOverride: 2 },
      { enemyType: 'invitation' },
      { enemyType: 'book' },
      { enemyType: 'camera' },
      { enemyType: 'invitation' },
      { enemyType: 'camera' },
    ],
  ],
]

function generateSpawns(stageId: number, difficultyId: DifficultyId = getSelectedDifficultyId()): SpawnEvent[] {
  const waves = (difficultyId === 'hard' ? HARD_STAGE_WAVES : STAGE_WAVES)[stageId - 1]
  const intraGap = difficultyId === 'hard' ? (stageId === 3 ? 900 : 1250) : stageId === 3 ? 1050 : 1600 - stageId * 100
  const interGap = difficultyId === 'hard' ? (stageId === 3 ? 3100 : 3600) : stageId === 3 ? 3600 : 4500 - stageId * 200
  const spawns: SpawnEvent[] = []
  let currentTime = 2000
  const styleCount: Record<string, number> = {}

  waves.forEach((wave, waveIndex) => {
    wave.forEach((spawn, spawnIndex) => {
      const style = ENEMY_CONFIGS[spawn.enemyType]?.moveStyle ?? 'swoop'
      const count = styleCount[style] ?? 0
      styleCount[style] = count + 1

      spawns.push({
        time: currentTime,
        spawnId: `${difficultyId}-stage-${stageId}-wave-${waveIndex + 1}-enemy-${spawnIndex + 1}`,
        enemyType: spawn.enemyType,
        x: 460,
        y: getSpawnY(spawn.enemyType, count, stageId * 11 + waveIndex * 5 + spawnIndex),
        dropItem: spawn.dropItem,
        patternOverride: spawn.patternOverride,
        shotCountOverride: getShotCountOverride(stageId, difficultyId, spawn),
      })
      currentTime += intraGap
    })

    currentTime += interGap - intraGap
  })

  return spawns
}

function getShotCountOverride(stageId: number, difficultyId: DifficultyId, spawn: WaveSpawn) {
  if (difficultyId === 'easy' && stageId === 1) return 0
  if (difficultyId === 'easy' && stageId === 3 && spawn.enemyType === 'invitation') return 1
  return spawn.shotCountOverride
}

export const STAGES: StageConfig[] = [
  {
    id: 1,
    name: '장거리 연애',
    bgKey: 'stage1-bg',
    textTheme: 'dark',
    scrollSpeed: 60,
    duration: 30000,
    bossType: 'train',
    spawns: generateSpawns(1, 'easy'),
  },
  {
    id: 2,
    name: '졸업 논문',
    bgKey: 'stage3-bg',
    bossBgKey: 'stage3-boss-bg',
    textTheme: 'dark',
    scrollSpeed: 70,
    duration: 30000,
    bossType: 'thesis',
    spawns: generateSpawns(2, 'easy'),
  },
  {
    id: 3,
    name: '결혼 준비',
    bgKey: 'stage2-bg',
    textTheme: 'light',
    scrollSpeed: 80,
    duration: 30000,
    bossType: 'piano',
    spawns: generateSpawns(3, 'easy'),
  },
]

export function getStageConfig(stageIndex: number, difficultyId: DifficultyId = getSelectedDifficultyId()): StageConfig {
  const stage = STAGES[stageIndex]
  return {
    ...stage,
    spawns: generateSpawns(stage.id, difficultyId),
  }
}
