import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Calendar, FileSignature, Wallet,
  PiggyBank, Heart, StickyNote, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Overview',      id: '1' },
  { to: '/calendario',   icon: Calendar,        label: 'Calendario',    id: '2' },
  { to: '/firme',        icon: FileSignature,   label: 'Firme',         id: '3' },
  { to: '/finanze',      icon: Wallet,          label: 'Finanze',       id: '4' },
  { to: '/risparmi',     icon: PiggyBank,       label: 'Risparmi',      id: '5' },
  { to: '/salute',       icon: Heart,           label: 'Salute',        id: '6' },
  { to: '/note',         icon: StickyNote,      label: 'Note',          id: '7' },
  { to: '/impostazioni', icon: Settings,        label: 'Impostazioni',  id: '8' },
]

function Sidebar() {
  const location = useLocation()

  return (
    <nav
      className="hidden lg:flex flex-col h-full bg-[var(--bg-surface)] w-[220px]
        border-r border-[var(--border-subtle)] shrink-0 overflow-hidden z-10"
      aria-label="Navigazione principale"
    >
      {/* Logo */}
      <div className="flex items-center h-[var(--header-height)] px-6 shrink-0 border-b border-[var(--border-subtle)]">
        <span
          className="text-base font-semibold text-[var(--text-primary)] whitespace-nowrap"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          vita<span style={{ color: 'var(--color-primary)' }}>OS</span>
        </span>
      </div>

      {/* Nav links */}
      <ul className="flex-1 py-4 space-y-0.5 overflow-hidden" role="list">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to))
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={clsx(
                  'flex items-center gap-3 mx-2 px-3 py-2 rounded-[var(--radius-md)]',
                  'transition-all duration-[var(--transition-fast)] relative group',
                  isActive
                    ? 'bg-[var(--color-primary-ghost)] text-[var(--color-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                )}
              >
                <item.icon size={16} className="shrink-0" />
                <span className="text-[13px] font-medium whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default Sidebar
