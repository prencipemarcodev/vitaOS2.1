import { Moon, Sun, Monitor } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import clsx from 'clsx'

function AppearanceSection() {
  const { theme, setTheme, userConfig } = useAppStore()

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme)
    if (userConfig?.id) {
      await supabase.from('user_config').update({ theme: newTheme }).eq('id', userConfig.id)
    }
  }

  const options = [
    { id: 'light', label: 'Chiaro', icon: Sun, preview: { bg: '#fafaf8', surface: '#ffffff', text: '#1a1714' } },
    { id: 'dark',  label: 'Scuro',  icon: Moon, preview: { bg: '#141210', surface: '#1e1c1a', text: '#f0ede8' } },
  ]

  return (
    <div className="space-y-4">
      

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleThemeChange(opt.id)}
            className={clsx(
              'relative p-4 rounded-[var(--radius-lg)] border-2 transition-all duration-200 text-left',
              theme === opt.id
                ? 'border-[var(--color-primary)] shadow-[0_0_0_1px_var(--color-primary)]'
                : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
            )}
          >
            {/* Mini preview */}
            <div
              className="w-full h-20 rounded-[var(--radius-md)] mb-3 p-2 flex flex-col gap-1"
              style={{ backgroundColor: opt.preview.bg }}
            >
              <div className="h-2 w-8 rounded-full" style={{ backgroundColor: opt.preview.surface }} />
              <div className="flex gap-1 flex-1">
                <div className="w-4 rounded" style={{ backgroundColor: opt.preview.surface }} />
                <div className="flex-1 rounded" style={{ backgroundColor: opt.preview.surface }}>
                  <div className="h-1.5 w-10 rounded-full m-1.5" style={{ backgroundColor: opt.preview.text, opacity: 0.2 }} />
                  <div className="h-1.5 w-6 rounded-full m-1.5" style={{ backgroundColor: opt.preview.text, opacity: 0.1 }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <opt.icon size={14} className={theme === opt.id ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'} />
              <span className={clsx('text-sm font-medium', theme === opt.id ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]')}>
                {opt.label}
              </span>
            </div>

            {theme === opt.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default AppearanceSection
