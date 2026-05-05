import type { DifficultyId } from './difficulty'
import type { PlayerCharacterId } from '../core/systems/PlayerSelection'

export const ACHIEVEMENT_EVENT = 'achievement-unlocked'

export const ACHIEVEMENT_ICON_KEYS = [
  'reunion',
  'cap',
  'bouquet',
  'ring',
  'double-cap',
  'heart',
  'camera',
  'thesis',
  'ticket',
] as const

export type AchievementIconKey = (typeof ACHIEVEMENT_ICON_KEYS)[number]

export const ACHIEVEMENT_IDS = [
  'bride-stage-1',
  'bride-stage-2',
  'bride-stage-3',
  'bride-stage-1-hard',
  'bride-stage-2-hard',
  'bride-stage-3-hard',
  'dragon-stage-1',
  'dragon-stage-2',
  'dragon-stage-3',
  'dragon-stage-1-hard',
  'dragon-stage-2-hard',
  'dragon-stage-3-hard',
  'stage-3-camera-no-hit',
  'stage-2-defense-no-hit',
  'stage-1-train-no-hit',
] as const

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number]

export interface AchievementDefinition {
  id: AchievementId
  name: string
  description: string
  iconKey: AchievementIconKey
  hardFrame?: boolean
  hiddenUntilDragonUnlocked?: boolean
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'bride-stage-1',
    name: '감동의 재회',
    description: '용사로 1스테이지를 normal 이상의 난이도로 클리어한다.',
    iconKey: 'reunion',
  },
  {
    id: 'bride-stage-2',
    name: 'Defense!',
    description: '용사로 2스테이지를 normal 이상의 난이도로 클리어한다.',
    iconKey: 'cap',
  },
  {
    id: 'bride-stage-3',
    name: '새로운 시작',
    description: '용사로 3스테이지를 normal 이상의 난이도로 클리어한다.',
    iconKey: 'bouquet',
  },
  {
    id: 'bride-stage-1-hard',
    name: '감동의 재회 (hard)',
    description: '용사로 1스테이지를 hard 난이도로 클리어한다.',
    iconKey: 'reunion',
    hardFrame: true,
  },
  {
    id: 'bride-stage-2-hard',
    name: 'Defense! (hard)',
    description: '용사로 2스테이지를 hard 난이도로 클리어한다.',
    iconKey: 'cap',
    hardFrame: true,
  },
  {
    id: 'bride-stage-3-hard',
    name: '새로운 시작 (hard)',
    description: '용사로 3스테이지를 hard 난이도로 클리어한다.',
    iconKey: 'bouquet',
    hardFrame: true,
  },
  {
    id: 'dragon-stage-1',
    name: '프로포즈',
    description: '용으로 1스테이지를 normal 이상의 난이도로 클리어한다.',
    iconKey: 'ring',
    hiddenUntilDragonUnlocked: true,
  },
  {
    id: 'dragon-stage-2',
    name: '또 한명의 박사',
    description: '용으로 2스테이지를 normal 이상의 난이도로 클리어한다.',
    iconKey: 'double-cap',
    hiddenUntilDragonUnlocked: true,
  },
  {
    id: 'dragon-stage-3',
    name: '행복한 사랑',
    description: '용으로 3스테이지를 normal 이상의 난이도로 클리어한다.',
    iconKey: 'heart',
    hiddenUntilDragonUnlocked: true,
  },
  {
    id: 'dragon-stage-1-hard',
    name: '프로포즈 (hard)',
    description: '용으로 1스테이지를 hard 난이도로 클리어한다.',
    iconKey: 'ring',
    hardFrame: true,
    hiddenUntilDragonUnlocked: true,
  },
  {
    id: 'dragon-stage-2-hard',
    name: '또 한명의 박사 (hard)',
    description: '용으로 2스테이지를 hard 난이도로 클리어한다.',
    iconKey: 'double-cap',
    hardFrame: true,
    hiddenUntilDragonUnlocked: true,
  },
  {
    id: 'dragon-stage-3-hard',
    name: '행복한 사랑 (hard)',
    description: '용으로 3스테이지를 hard 난이도로 클리어한다.',
    iconKey: 'heart',
    hardFrame: true,
    hiddenUntilDragonUnlocked: true,
  },
  {
    id: 'stage-3-camera-no-hit',
    name: '사진 공포증',
    description: '3스테이지에서 카메라 광선을 한 대도 맞지 않고 normal 이상의 난이도로 클리어한다.',
    iconKey: 'camera',
  },
  {
    id: 'stage-2-defense-no-hit',
    name: '완벽한 논문',
    description: '2스테이지 보스전에서 디펜스를 맞지 않고 normal 이상의 난이도로 클리어한다.',
    iconKey: 'thesis',
  },
  {
    id: 'stage-1-train-no-hit',
    name: '예매마스터',
    description: '1스테이지 기차 보스전에서 한 대도 맞지 않고 normal 이상의 난이도로 클리어한다.',
    iconKey: 'ticket',
  },
]

export function isAchievementId(value: string): value is AchievementId {
  return (ACHIEVEMENT_IDS as readonly string[]).includes(value)
}

export function getStageClearAchievementIds(
  character: PlayerCharacterId,
  difficulty: DifficultyId,
  stageIndex: number,
): AchievementId[] {
  if (stageIndex < 0 || stageIndex > 2) return []
  if (difficulty === 'easy') return []

  const prefix = character === 'dragon' ? 'dragon' : 'bride'
  const ids: AchievementId[] = [`${prefix}-stage-${stageIndex + 1}` as AchievementId]
  if (difficulty === 'hard') {
    ids.push(`${prefix}-stage-${stageIndex + 1}-hard` as AchievementId)
  }
  return ids
}
