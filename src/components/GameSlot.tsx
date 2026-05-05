import type { FooterContent } from '../types/site'

interface GameSlotProps {
  footer: FooterContent
  isOpen: boolean
  remaining: number
  isReady: boolean
}

export function GameSlot({ footer, isOpen, remaining, isReady }: GameSlotProps) {
  const description = isReady
    ? footer.secretLabels.ready
    : footer.secretLabels.countdown.replace('{remaining}', String(remaining))

  return (
    <div className={`game-slot${isOpen ? ' is-open' : ''}`} aria-hidden={!isOpen}>
      <div className="game-slot__inner">
        <p className="game-slot__title">{footer.panelTitle}</p>
        <p>{description || footer.secretLabels.default}</p>
      </div>
    </div>
  )
}
