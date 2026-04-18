import { Reveal } from './Reveal'

interface SectionHeadingProps {
  title: string
  subtitle?: string
  centered?: boolean
}

export function SectionHeading({
  title,
  subtitle,
  centered = true,
}: SectionHeadingProps) {
  return (
    <Reveal className={`section-heading${centered ? ' is-centered' : ''}`}>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </Reveal>
  )
}
