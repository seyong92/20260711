import type { GameEntryContent } from '../types/site'

interface GameSlotProps {
  gameEntry: GameEntryContent
  isOpen: boolean
}

export function GameSlot({ gameEntry, isOpen }: GameSlotProps) {
  return (
    <div className={`game-slot${isOpen ? ' is-open' : ''}`} aria-hidden={!isOpen}>
      <div className="game-slot__inner">
        <p className="game-slot__title">{gameEntry.panelTitle}</p>
        <p>{gameEntry.panelDescription}</p>
      </div>
    </div>
  )
}
