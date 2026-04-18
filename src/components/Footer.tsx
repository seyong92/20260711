import { useState } from 'react'

import type { FooterContent, GameEntryContent } from '../types/site'
import { GameSlot } from './GameSlot'

interface FooterProps {
  footer: FooterContent
  gameEntry: GameEntryContent
}

export function Footer({ footer, gameEntry }: FooterProps) {
  const [gameVisible, setGameVisible] = useState(false)

  return (
    <footer className="footer">
      <p className="footer__license">{footer.license}</p>
      <button
        type="button"
        className="footer__secret-link"
        onClick={() => setGameVisible((visible) => !visible)}
      >
        {gameEntry.teaserLabel}
      </button>
      <GameSlot gameEntry={gameEntry} isOpen={gameVisible} />
    </footer>
  )
}
