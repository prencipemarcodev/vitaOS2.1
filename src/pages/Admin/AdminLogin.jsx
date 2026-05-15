import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, User, ArrowRight, KeyRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Credenziali, 2: OTP
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')

  const ADMIN_EMAIL = 'prencipemarco.dev@gmail.com'

  const logAdminAccess = async (method) => {
    try {
      await supabase.from('admin_logs').insert({
        action: `LOGIN_${method}`,
        user_email: ADMIN_EMAIL
      })
    } catch (err) {
      console.warn('Errore durante la registrazione del log:', err)
    }
  }

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    
    if (username === 'admin' && password === '1230') {
      setLoading(true)
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: ADMIN_EMAIL,
          options: {
            shouldCreateUser: false
          }
        })
        
        if (error) {
          if (error.status === 429) {
            toast.error("Limite email superato. Usa il Master OTP.")
          } else {
            throw error
          }
        } else {
          toast.success(`OTP inviato a ${ADMIN_EMAIL}`)
        }
        
        // Passiamo comunque allo step 2 per permettere l'uso del Master OTP
        setStep(2)
      } catch (err) {
        toast.error("Errore nell'invio dell'OTP")
        console.error(err)
      } finally {
        setLoading(false)
      }
    } else {
      toast.error('Credenziali non valide')
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Fallback Master OTP
    if (otp === '27042000') {
      const { setIsAdminMaster } = useAuthStore.getState()
      setIsAdminMaster(true)
      await logAdminAccess('MASTER_OTP')
      toast.success('Accesso via Master OTP autorizzato')
      navigate('/admin/dashboard')
      setLoading(false)
      return
    }

    try {
      // Verifica l'OTP con Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: ADMIN_EMAIL,
        token: otp,
        type: 'email'
      })
      
      if (error) throw error
      
      if (data.session) {
        await logAdminAccess('EMAIL_OTP')
        toast.success('Accesso Admin effettuato con successo!')
        navigate('/admin/dashboard')
      }
    } catch (err) {
      toast.error('OTP non valido o scaduto')
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
            Accesso Riservato Amministrazione
          </p>
        </div>

        <div className="w-full max-w-sm z-10 relative overflow-hidden">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--bg-elevated)]">
            <motion.div 
              className="h-full bg-[var(--color-primary)]"
              initial={{ width: '50%' }}
              animate={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>

          {step === 1 ? (
            <motion.form 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onSubmit={handleCredentialsSubmit} 
              className="space-y-4 pt-4"
            >
              <Input
                label="Username"
                type="text"
                placeholder="Inserisci username"
                icon={User}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                size="lg"
                loading={loading}
                className="w-full mt-2"
                iconRight={ArrowRight}
              >
                Verifica Identità
              </Button>
            </motion.form>
          ) : (
            <motion.form 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onSubmit={handleOtpSubmit} 
              className="space-y-4 pt-4"
            >
              <div className="text-center mb-6">
                <Mail className="mx-auto text-[var(--color-primary)] mb-2" size={24} />
                <p className="text-sm text-[var(--text-secondary)]">
                  Abbiamo inviato un codice OTP a<br/>
                  <strong className="text-[var(--text-primary)]">{ADMIN_EMAIL}</strong>
                </p>
              </div>

              <Input
                label="Codice OTP"
                type="text"
                placeholder="000000"
                icon={KeyRound}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={8}
                className="text-center tracking-[0.5em] font-mono font-bold"
              />

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="subtle"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="flex-[2]"
                >
                  Accedi
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
