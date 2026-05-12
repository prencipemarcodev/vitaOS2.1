import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * PageWrapper — wrappa il contenuto di ogni pannello.
 * Su desktop applica l'altezza above-the-fold esatta.
 * Su mobile lascia lo scroll naturale.
 */
function PageWrapper({ children, className, noPadding = false }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={clsx(
        'flex-1 overflow-hidden flex flex-col',
        !noPadding && 'p-3 lg:p-4',
        'lg:h-[var(--content-height)]',
        // Mobile: allow scroll + bottom nav clearance
        'max-lg:overflow-y-auto max-lg:h-auto max-lg:pb-[calc(56px+env(safe-area-inset-bottom,0px)+12px)]',
        className
      )}
    >
      {children}
    </motion.main>
  )
}

export default PageWrapper
