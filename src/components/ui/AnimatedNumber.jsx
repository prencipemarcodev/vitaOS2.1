import { useEffect, useRef, useState } from 'react'

/**
 * AnimatedNumber — conta da 0 al valore target in 600ms.
 * @param {number} value         — valore finale
 * @param {string} prefix        — es. "€"
 * @param {string} suffix        — es. "h"
 * @param {number} decimals      — cifre decimali
 * @param {number} duration      — ms (default 600)
 */
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, duration = 600, className }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)
  const prevValueRef = useRef(0)

  useEffect(() => {
    const from = prevValueRef.current
    const to = value ?? 0
    prevValueRef.current = to

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = null

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => rafRef.current && cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  const formatted = display.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

export default AnimatedNumber
