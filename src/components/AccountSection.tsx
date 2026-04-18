import { useState } from 'react'

import type { AccountsContent, AccountEntry, NavItem } from '../types/site'
import { Icon } from './icons'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

interface AccountSectionProps {
  section: NavItem
  accounts: AccountsContent
}

function AccountCard({
  entry,
}: {
  entry: AccountEntry
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(entry.accountNumber.replaceAll('-', ''))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="account-card__row">
      <div>
        <p className="account-card__bank">{entry.bank}</p>
        <strong className="account-card__number">{entry.accountNumber}</strong>
        <p className="account-card__holder">{entry.holder}</p>
      </div>
      <button type="button" className="copy-button" onClick={handleCopy}>
        <Icon name="copy" className="copy-button__icon" />
        <span>{copied ? '복사됨' : '복사하기'}</span>
      </button>
    </div>
  )
}

export function AccountSection({ section, accounts }: AccountSectionProps) {
  const groupedEntries = {
    groom: accounts.entries.filter((entry) => entry.side === 'groom'),
    bride: accounts.entries.filter((entry) => entry.side === 'bride'),
  }

  return (
    <section id={section.sectionId} className="section section--accounts">
      <SectionHeading title={accounts.title} />
      <Reveal className="section-lead" delay={40}>
        {accounts.description.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </Reveal>

      <div className="account-groups">
        {([
          ['groom', "Groom's Side"],
          ['bride', "Bride's Side"],
        ] as const).map(([key, label]) => (
          <Reveal key={key} as="article" className="account-group" delay={key === 'groom' ? 100 : 180}>
            <p className="account-group__label">{label}</p>
            <div className="account-group__card">
              {groupedEntries[key].map((entry) => (
                <AccountCard key={`${entry.side}-${entry.accountNumber}`} entry={entry} />
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
