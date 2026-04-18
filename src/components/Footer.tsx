import { useState } from 'react'

import type { FooterContent } from '../types/site'
import { GameSlot } from './GameSlot'
import { Reveal } from './Reveal'

interface FooterProps {
  footer: FooterContent
}

export function Footer({ footer }: FooterProps) {
  const [gameVisible, setGameVisible] = useState(false)

  return (
    <footer className="footer">
      <Reveal className="footer__inner" threshold={0.01} rootMargin="0px 0px -2% 0px">
        <p className="footer__license">{footer.license}</p>
        <button
          type="button"
          className="footer__secret-link"
          onClick={() => setGameVisible((visible) => !visible)}
        >
          {footer.teaserLabel}
        </button>
        <GameSlot footer={footer} isOpen={gameVisible} />
      </Reveal>
    </footer>
  )
}
