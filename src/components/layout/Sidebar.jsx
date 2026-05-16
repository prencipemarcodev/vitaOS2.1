import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Calendar, FileSignature, Wallet,
  PiggyBank, Heart, StickyNote, Settings, LogIn
} from 'lucide-react'
import clsx from 'clsx'
import { useAuthStore } from '@/store/useAuthStore'
import Logo from './Logo'
import { useWorkSessionStore } from '@/store/useWorkSessionStore'


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
  const { isRunning } = useWorkSessionStore()

  return (
    <nav
      className="hidden lg:flex flex-col h-full bg-[var(--bg-surface)] w-[220px]
        border-r border-[var(--border-subtle)] shrink-0 overflow-hidden z-10"
      aria-label="Navigazione principale"
    >
      {/* Logo */}
      <div className="flex items-center h-[var(--header-height)] px-6 shrink-0 border-b border-[var(--border-subtle)]">
        <Logo className="text-base" />
      </div>

      {/* Nav links */}
      <div className="flex-1 flex flex-col py-4 overflow-hidden" role="list">
        {/* TOP: Overview */}
        <div className="px-2 mb-2">
          <NavItem 
            item={NAV_ITEMS.find(i => i.to === '/')} 
            isActive={location.pathname === '/'} 
          />
        </div>

        {/* SEPARATOR */}
        <div className="mx-5 my-2 h-[1px] bg-[var(--border-subtle)]" />

        {/* MIDDLE: Sections */}
        <ul className="flex-1 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.filter(i => i.to !== '/' && i.to !== '/impostazioni').map((item) => (
            <li key={item.to}>
              <NavItem 
                item={item} 
                isActive={location.pathname.startsWith(item.to)} 
                showBadge={item.to === '/firme' && isRunning}
              />
            </li>
          ))}
        </ul>

        {/* BOTTOM: Settings & Logout */}
        <div className="px-2 mt-auto pt-4 border-t border-[var(--border-subtle)] space-y-1">
          <NavItem 
            item={NAV_ITEMS.find(i => i.to === '/impostazioni')} 
            isActive={location.pathname.startsWith('/impostazioni')} 
          />
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}

function LogoutButton() {
  const { signOut } = useAuthStore()
  
  return (
    <button
      onClick={() => {
        if(confirm('Vuoi uscire da VitaOS?')) signOut()
      }}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)]
        text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600
        transition-all duration-[var(--transition-fast)]"
    >
      <LogIn size={18} className="shrink-0 rotate-180" />
      <span className="text-[13px] font-medium">Esci</span>
    </button>
  )
}



function NavItem({ item, isActive, showBadge }) {
  if (!item) return null
  return (
    <NavLink
      to={item.to}
      className={clsx(
        'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)]',
        'transition-all duration-[var(--transition-fast)] relative group',
        isActive
          ? 'bg-[var(--color-primary-ghost)] text-[var(--color-primary)] font-bold'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
      )}
    >
      <item.icon size={18} className={clsx('shrink-0 transition-transform', isActive && 'scale-110')} />
      <span className="text-[13px] font-medium whitespace-nowrap overflow-hidden flex-1">
        {item.label}
      </span>
      {showBadge && (
        <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
      )}
      {isActive && (
        <motion.div 
          layoutId="active-pill"
          className="absolute left-0 w-1 h-4 bg-[var(--color-primary)] rounded-full"
        />
      )}
    </NavLink>
  )
}

export default Sidebar
