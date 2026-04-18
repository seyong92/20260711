import { createElement } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { useRevealOnScroll } from '../hooks/useRevealOnScroll'

interface RevealProps {
  as?: keyof HTMLElementTagNameMap
  children: ReactNode
  className?: string
  delay?: number
  rootMargin?: string
  threshold?: number
  style?: CSSProperties
  [key: string]: unknown
}

type RevealStyle = CSSProperties & {
  '--reveal-delay'?: string
}

export function Reveal({
  as = 'div',
  children,
  className,
  delay = 0,
  rootMargin,
  threshold,
  style,
  ...rest
}: RevealProps) {
  const { ref, isVisible } = useRevealOnScroll({ rootMargin, threshold })
  return createElement(
    as,
    {
      ref: ref as never,
      className: `reveal${isVisible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`,
      style: { '--reveal-delay': `${delay}ms`, ...style } as RevealStyle,
      ...rest,
    },
    children,
  )
}
