import type { FamilyContent, NavItem } from '../types/site'
import { Reveal } from './Reveal'

interface FamilyInfoProps {
  section: NavItem
  family: FamilyContent
}

function FamilyRow({
  roleLabel,
  parents,
  relation,
  name,
}: FamilyContent['groom']) {
  return (
    <div className="family-row">
      <div className="family-row__parents">
        <p className="family-row__role-label">{roleLabel}</p>
        <div className="family-row__parent-list">
          {parents.map((parent) => (
            <strong
              key={`${parent.name}-${parent.deceased ? 'deceased' : 'living'}`}
              className={parent.deceased ? 'family-row__parent is-deceased' : 'family-row__parent'}
            >
              {parent.deceased ? <span className="family-row__deceased-mark">故</span> : null}
              <span>{parent.name}</span>
            </strong>
          ))}
        </div>
      </div>
      <div className="family-row__relation">{relation}</div>
      <div className="family-row__child">{name}</div>
    </div>
  )
}

export function FamilyInfo({ section, family }: FamilyInfoProps) {
  return (
    <section id={section.sectionId} className="section section--family">
      <Reveal delay={40}>
        <FamilyRow {...family.groom} />
      </Reveal>
      <div className="family-divider" />
      <Reveal delay={140}>
        <FamilyRow {...family.bride} />
      </Reveal>
    </section>
  )
}
