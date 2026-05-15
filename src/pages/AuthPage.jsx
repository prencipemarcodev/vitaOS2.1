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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <span
            className="text-4xl font-semibold text-[var(--text-primary)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            vita<span style={{ color: 'var(--color-primary)' }}>OS</span>
          </span>
          <p className="text-[var(--text-muted)] text-sm font-medium">
            {isLogin ? 'Bentornato! Accedi per gestire la tua vita.' : 'Inizia oggi il tuo viaggio con VitaOS.'}
          </p>
        </div>

        <Card padding="xl" className="shadow-lg border-[var(--border-subtle)]">
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
              className="w-full mt-2"
              size="lg"
              loading={loading}
              iconRight={ArrowRight}
            >
              {isLogin ? 'Accedi' : 'Registrati'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              {isLogin ? (
                <>
                  <UserPlus size={16} />
                  Non hai un account? Registrati
                </>
              ) : (
                <>
                  <LogIn size={16} />
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
