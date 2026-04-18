import type { FooterContent } from '../types/site'

interface GameSlotProps {
  footer: FooterContent
  isOpen: boolean
}

export function GameSlot({ footer, isOpen }: GameSlotProps) {
  return (
    <div className={`game-slot${isOpen ? ' is-open' : ''}`} aria-hidden={!isOpen}>
      <div className="game-slot__inner">
        <p className="game-slot__title">{footer.panelTitle}</p>
        <p>{footer.panelDescription}</p>
      </div>
    </div>
  )
}
