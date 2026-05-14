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
        'flex-1 flex flex-col min-h-0',
        !noPadding && 'p-3 pb-[calc(var(--pill-nav-clearance,76px)+env(safe-area-inset-bottom,0px))] lg:p-4',
        'h-full overflow-y-auto',
        className
      )}
    >
      {children}
    </motion.main>
  )
}

export default PageWrapper
