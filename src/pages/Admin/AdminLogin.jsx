import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, User, ArrowRight, KeyRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Credenziali, 2: OTP
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')

  const ADMIN_EMAIL = 'prencipemarco.dev@gmail.com'

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    
    // Verifica credenziali hardcoded lato client (Step 1)
    if (username === 'admin' && password === '1230') {
      setLoading(true)
      try {
        // Richiedi invio OTP all'email dell'admin tramite Supabase
        const { error } = await supabase.auth.signInWithOtp({
          email: ADMIN_EMAIL,
          options: {
            shouldCreateUser: true // Crea l'utente admin se non esiste ancora
          }
        })
        
        if (error) throw error
        
        toast.success(`OTP inviato a ${ADMIN_EMAIL}`)
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
    
    try {
      // Verifica l'OTP con Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: ADMIN_EMAIL,
        token: otp,
        type: 'email'
      })
      
      if (error) throw error
      
      if (data.session) {
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background decoration admin */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-900 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl border border-white/10">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Admin Control
          </h1>
          <p className="text-purple-300/60 text-xs mt-2 uppercase tracking-widest font-bold">
            Accesso Riservato
          </p>
        </div>

        <Card padding="xl" className="bg-[#111] border-white/10 shadow-2xl relative overflow-hidden">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <motion.div 
              className="h-full bg-purple-500"
              initial={{ width: '50%' }}
              animate={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>

          {step === 1 ? (
            <motion.form 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onSubmit={handleCredentialsSubmit} 
              className="space-y-4 pt-2"
            >
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">Username</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                    placeholder="Inserisci username"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-12 bg-white text-black hover:bg-gray-200 mt-6 font-black uppercase tracking-widest"
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
              className="space-y-4 pt-2"
            >
              <div className="text-center mb-6">
                <Mail className="mx-auto text-purple-400 mb-2" size={24} />
                <p className="text-sm text-white/70">
                  Abbiamo inviato un codice OTP a<br/>
                  <strong className="text-white">{ADMIN_EMAIL}</strong>
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">Codice OTP</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:border-purple-500/50 transition-colors"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 bg-white/5 text-white hover:bg-white/10 font-bold"
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-[2] h-12 bg-purple-600 text-white hover:bg-purple-700 font-black uppercase tracking-widest"
                >
                  Accedi
                </Button>
              </div>
            </motion.form>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
