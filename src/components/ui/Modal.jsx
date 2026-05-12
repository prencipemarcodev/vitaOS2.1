import { X } from 'lucide-react'
import ModalPortal from './ModalPortal'
import Button from './Button'

/**
 * Modal — wrapper conveniente sopra ModalPortal.
 * @param {string} title
 * @param {ReactNode} footer
 */
function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} size={size}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        {title && (
          <h2 className="text-lg font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          icon={X}
          className="ml-auto -mr-1"
          onClick={onClose}
          aria-label="Chiudi modal"
        />
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border-subtle)]">
          {footer}
        </div>
      )}
    </ModalPortal>
  )
}

export default Modal
