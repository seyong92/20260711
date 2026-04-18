import type { FamilyContent, NavItem } from '../types/site'

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
        <p>{roleLabel}</p>
        {parents.map((parent) => (
          <strong key={parent}>{parent}</strong>
        ))}
      </div>
      <div className="family-row__relation">{relation}</div>
      <div className="family-row__child">{name}</div>
    </div>
  )
}

export function FamilyInfo({ section, family }: FamilyInfoProps) {
  return (
    <section id={section.sectionId} className="section section--family">
      <FamilyRow {...family.groom} />
      <div className="family-divider" />
      <FamilyRow {...family.bride} />
    </section>
  )
}
