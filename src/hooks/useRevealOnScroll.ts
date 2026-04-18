import { useEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from './usePrefersReducedMotion'

interface UseRevealOnScrollOptions {
  once?: boolean
  rootMargin?: string
  threshold?: number
}

export function useRevealOnScroll({
  once = true,
  rootMargin = '0px 0px -12% 0px',
  threshold = 0.18,
}: UseRevealOnScrollOptions = {}) {
  const ref = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const node = ref.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)

          if (once) {
            observer.unobserve(node)
          }

          return
        }

        if (!once) {
          setIsVisible(false)
        }
      },
      {
        rootMargin,
        threshold,
      },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [once, prefersReducedMotion, rootMargin, threshold])

  return { ref, isVisible: prefersReducedMotion || isVisible }
}
