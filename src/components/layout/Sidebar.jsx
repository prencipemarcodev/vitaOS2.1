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
      className="hidden lg:flex flex-col w-[220px] shrink-0 overflow-hidden z-10
        bg-[var(--bg-surface)] border border-[var(--border-subtle)]
        my-4 ml-4 mr-1.5 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
      aria-label="Navigazione principale"
    >
      {/* Logo */}
      <div className="flex items-center pt-6 pb-2 px-6 shrink-0">
        <Logo className="text-base" />
      </div>

      {/* Nav links */}
      <div className="flex-1 flex flex-col py-3 overflow-hidden" role="list">
        {/* TOP: Overview */}
        <div className="px-2.5 mb-1.5">
          <NavItem 
            item={NAV_ITEMS.find(i => i.to === '/')} 
            isActive={location.pathname === '/'} 
          />
        </div>

        {/* SEPARATOR */}
        <div className="mx-5 my-1.5 h-[1px] bg-[var(--border-subtle)]/60" />

        {/* MIDDLE: Sections */}
        <ul className="flex-1 px-2.5 space-y-0.5 overflow-y-auto custom-scrollbar">
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

        {/* BOTTOM: Settings & Logout & Profile */}
        <div className="px-2.5 mt-auto pt-3 border-t border-[var(--border-subtle)]/40 space-y-1">
          <NavItem 
            item={NAV_ITEMS.find(i => i.to === '/impostazioni')} 
            isActive={location.pathname.startsWith('/impostazioni')} 
          />
          <LogoutButton />
          
          <UserProfile />
        </div>
      </div>
    </nav>
  )
}

function UserProfile() {
  const { user } = useAuthStore()
  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Marco'
  const initial = displayName.charAt(0).toUpperCase()

  // Colore di sfondo dinamico e morbido basato sull'iniziale
  const colors = [
    'bg-gradient-to-tr from-rose-500 to-orange-400 text-white',
    'bg-gradient-to-tr from-sky-500 to-indigo-400 text-white',
    'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white',
    'bg-gradient-to-tr from-violet-600 to-fuchsia-400 text-white',
    'bg-gradient-to-tr from-amber-500 to-yellow-400 text-white'
  ]
  const colorIndex = displayName.charCodeAt(0) % colors.length
  const bgClass = colors[colorIndex]

  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)]/30 mt-2 select-none">
      <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${bgClass}`} style={{ width: '30px', height: '30px' }}>
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black text-[var(--text-primary)] truncate capitalize leading-tight">
          {displayName}
        </p>
        <p className="text-[9px] font-semibold text-[var(--text-muted)] truncate mt-0.5 leading-none">
          {user.email}
        </p>
      </div>
    </div>
  )
}

function LogoutButton() {
  const { signOut } = useAuthStore()
  
  return (
    <button
      onClick={() => {
        if(confirm('Vuoi uscire da VitaOS?')) signOut()
      }}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl
        text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600
        transition-all duration-[var(--transition-fast)]"
    >
      <LogIn size={16} className="shrink-0 rotate-180 text-[var(--text-muted)] hover:text-red-500" />
      <span className="text-[13px] font-semibold">Esci</span>
    </button>
  )
}

function NavItem({ item, isActive, showBadge }) {
  if (!item) return null
  return (
    <NavLink
      to={item.to}
      className={clsx(
        'flex items-center gap-3 px-3 py-2 rounded-xl',
        'transition-all duration-[var(--transition-fast)] relative group',
        isActive
          ? 'bg-[var(--color-primary-ghost)] text-[var(--color-primary)] font-bold shadow-sm'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
      )}
    >
      <item.icon size={16} className={clsx('shrink-0 transition-transform', isActive && 'scale-110')} />
      <span className="text-[13px] font-semibold whitespace-nowrap overflow-hidden flex-1">
        {item.label}
      </span>
      {showBadge && (
        <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
      )}
      {isActive && (
        <motion.div 
          layoutId="active-pill"
          className="absolute left-1 w-1 h-3.5 bg-[var(--color-primary)] rounded-full"
        />
      )}
    </NavLink>
  )
}

export default Sidebar

