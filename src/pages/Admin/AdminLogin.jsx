import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Mail, ArrowRight, KeyRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

// L'email admin è l'unico segreto "accettabile" qui (è comunque visibile nel DB)
// Le credenziali hardcoded sono state RIMOSSE per motivi di sicurezza (VUL-001).
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''

export default function AdminLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState(ADMIN_EMAIL)
  const [otp, setOtp] = useState('')

  const logAdminAccess = async (method) => {
    try {
      await supabase.from('admin_logs').insert({
        action: `LOGIN_${method}`,
        user_email: email
      })
    } catch (err) {
      console.warn('Errore durante la registrazione del log:', err)
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error('Inserisci un indirizzo email valido')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      })

      if (error) {
        if (error.status === 429) {
          toast.error('Limite email superato. Riprova tra qualche minuto.')
        } else {
          throw error
        }
      } else {
        toast.success(`Codice OTP inviato a ${email}`)
        setStep(2)
      }
    } catch (err) {
      toast.error("Errore nell'invio dell'OTP. Verifica l'email.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })

      if (error) throw error

      if (data.session) {
        // Verifica che l'email sia quella admin — server-side (via JWT)
        if (data.session.user.email !== ADMIN_EMAIL) {
          await supabase.auth.signOut()
          toast.error('Accesso non autorizzato.')
          setLoading(false)
          return
        }
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
              onSubmit={handleEmailSubmit}
              className="space-y-4 pt-4"
            >
              <div className="p-3 bg-[var(--color-primary-ghost)] rounded-xl border border-[var(--color-primary)]/20 flex items-start gap-3 mb-4">
                <Shield className="text-[var(--color-primary)] mt-0.5 shrink-0" size={16} />
                <p className="text-xs text-[var(--text-secondary)]">
                  L'accesso admin è protetto tramite OTP inviato via email. Solo l'account admin registrato può accedere.
                </p>
              </div>

              <Input
                label="Email Admin"
                type="email"
                placeholder="admin@esempio.com"
                icon={Mail}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
                iconRight={ArrowRight}
              >
                Invia Codice OTP
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
                  <strong className="text-[var(--text-primary)]">{email}</strong>
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
                maxLength={6}
                className="text-center tracking-[0.5em] font-mono font-bold"
              />

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="subtle"
                  size="lg"
                  onClick={() => { setStep(1); setOtp('') }}
                  className="flex-1"
                >
                  Indietro
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
