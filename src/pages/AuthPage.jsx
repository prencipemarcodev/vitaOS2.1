import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, UserPlus, Mail, Lock, ArrowRight } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Accesso effettuato!')
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              // Dati aggiuntivi per il profilo se necessario
            }
          }
        })
        if (error) throw error
        toast.success('Registrazione completata! Controlla la tua email per confermare.')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[var(--color-primary-ghost)] rounded-full blur-[120px] opacity-50" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[var(--color-success-ghost)] rounded-full blur-[120px] opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-black rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl"
          >
            <span className="text-white text-2xl font-black italic">vO</span>
          </motion.div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight italic" style={{ fontFamily: 'var(--font-display)' }}>
            VitaOS
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-2 font-medium">
            {isLogin ? 'Bentornato! Accedi per gestire la tua vita.' : 'Inizia oggi il tuo viaggio con VitaOS.'}
          </p>
        </div>

        <Card padding="xl" className="shadow-2xl border-[var(--border-subtle)]">
          <form onSubmit={handleAuth} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="tu@esempio.com"
              icon={Mail}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 shadow-lg shadow-black/10"
              loading={loading}
              iconRight={ArrowRight}
            >
              {isLogin ? 'Accedi' : 'Registrati'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
            >
              {isLogin ? (
                <>
                  <UserPlus size={14} />
                  Non hai un account? Registrati
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  Hai già un account? Accedi
                </>
              )}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
