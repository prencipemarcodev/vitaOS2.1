import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

/**
 * Carousel — slider riusabile con Framer Motion AnimatePresence.
 * Supporta frecce, dot indicator cliccabili e swipe su mobile.
 */
function Carousel({ slides, className }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = avanti, -1 = indietro

  const goTo = (index) => {
    setDirection(index > current ? 1 : -1)
    setCurrent(index)
  }
  const prev = () => { if (current > 0) goTo(current - 1) }
  const next = () => { if (current < slides.length - 1) goTo(current + 1) }

  // Swipe support
  let touchStartX = 0
  const handleTouchStart = (e) => { touchStartX = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    const delta = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev()
  }

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  }

  return (
    <div className={clsx('relative flex flex-col h-full', className)}>
      {/* Slide area */}
      <div
        className="relative flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0"
          >
            {slides[current]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-3 shrink-0">
        <button
          onClick={prev}
          disabled={current === 0}
          className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
          aria-label="Slide precedente"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              className="h-1.5 rounded-full transition-all duration-200"
              animate={{ width: i === current ? 20 : 6, opacity: i === current ? 1 : 0.35 }}
              style={{ backgroundColor: 'var(--color-primary)' }}
              aria-label={`Vai alla slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
          aria-label="Slide successiva"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default Carousel
