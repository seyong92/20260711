import { siteContent } from '../../data/siteContent'
import type { GameModeId, StorySequenceId } from '../../types/site'
import { getSelectedPlayerCharacter } from '../core/systems/PlayerSelection'

export const gameContent = siteContent.gameConfig
export const STORY_SEQUENCE_IDS: StorySequenceId[] = ['intro', 'afterStage1', 'afterStage2', 'ending']

export function getGameModeContent(character: GameModeId = getSelectedPlayerCharacter()) {
  return gameContent.modes[character]
}

export function getStoryImageKey(character: GameModeId, sequenceId: StorySequenceId, slideIndex: number) {
  return `story-${character}-${sequenceId}-${slideIndex}`
}

export function getStoryImageUrl(character: GameModeId, fileName: string) {
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${baseUrl}images/game/story/${character}/${fileName}`
}
