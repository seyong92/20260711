import { useState } from 'react'

import { buildAppPath } from '../lib/routes'
import type { FooterContent } from '../types/site'
import { GameSlot } from './GameSlot'
import { Reveal } from './Reveal'

interface FooterProps {
  footer: FooterContent
}

export function Footer({ footer }: FooterProps) {
  const [secretClicks, setSecretClicks] = useState(0)

  const remaining = Math.max(footer.secretTriggerCount - secretClicks, 0)
  const isVisible = secretClicks > 0
  const isReady = remaining <= 1

  function handleSecretClick() {
    setSecretClicks((current) => {
      const next = current + 1

      if (next >= footer.secretTriggerCount) {
        window.location.assign(buildAppPath(footer.gamePath))
        return current
      }

      return next
    })
  }

  return (
    <footer className="footer">
      <Reveal className="footer__inner" threshold={0.01} rootMargin="0px 0px -2% 0px">
        <p className="footer__license">{footer.license}</p>
        {footer.showGameEntry && (
          <>
            <button
              type="button"
              className="footer__secret-link"
              onClick={handleSecretClick}
            >
              {footer.teaserLabel}
            </button>
            <GameSlot footer={footer} isOpen={isVisible} remaining={remaining} isReady={isReady} />
          </>
        )}
      </Reveal>
    </footer>
  )
}
