import { useState } from 'react'
import Modal from './Modal'
import { ICON_MAP } from '@/lib/icons'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'

function IconPickerModal({ isOpen, onClose, onSelect, currentIcon }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const icons = Object.keys(ICON_MAP).filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Scegli un'icona"
      className="!max-w-md"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input 
            type="text" 
            placeholder="Cerca icona..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-5 gap-3 max-h-[320px] overflow-y-auto p-1 custom-scrollbar">
          {icons.map((name) => {
            const Icon = ICON_MAP[name]
            const isSelected = currentIcon === name

            return (
              <button
                key={name}
                onClick={() => {
                  onSelect(name)
                  onClose()
                }}
                className={clsx(
                  "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all group",
                  isSelected 
                    ? "bg-[var(--color-primary-ghost)] border-[var(--color-primary)] text-[var(--color-primary)]" 
                    : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                )}
                title={name}
              >
                <Icon size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-[8px] mt-1.5 font-bold uppercase tracking-tight truncate w-full text-center">
                  {name}
                </span>
              </button>
            )
          })}
          {icons.length === 0 && (
            <div className="col-span-5 py-8 text-center">
              <p className="text-xs text-[var(--text-muted)]">Nessuna icona trovata per "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default IconPickerModal
