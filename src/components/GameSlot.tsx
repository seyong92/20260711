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
    <div
      className={`game-slot${isOpen ? ' is-open' : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={!isOpen}
    >
      <div className="game-slot__inner">
        <p>{description || footer.secretLabels.default}</p>
      </div>
    </div>
  )
}
