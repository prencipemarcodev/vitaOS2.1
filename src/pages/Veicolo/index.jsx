import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Car } from 'lucide-react'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import VehicleCarousel from './VehicleCarousel'
import VehicleDashboard from './VehicleDashboard'
import AddVehicleModal from './AddVehicleModal'
import { useConfirmStore } from '@/store/useConfirmStore'

function Veicolo() {
  const confirm = useConfirmStore(s => s.confirm)
  const [vehicles, setVehicles]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [dbError, setDbError]           = useState(false)
  const [activeIndex, setActiveIndex]   = useState(0)
  const [showModal, setShowModal]       = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)

  // ── Fetch vehicles ──────────────────────────────────────────
  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) {
        if (error.message?.includes('relation "public.vehicles" does not exist') || error.code === '42P01') {
          setDbError(true)
        } else {
          toast.error('Errore nel caricamento del garage')
        }
        return
      }
      setVehicles(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVehicles() }, [])

  // ── Clamp activeIndex when vehicles change ──────────────────
  useEffect(() => {
    if (vehicles.length > 0 && activeIndex >= vehicles.length) {
      setActiveIndex(vehicles.length - 1)
    }
  }, [vehicles.length])

  const activeVehicle = vehicles[activeIndex] ?? null

  const handleOpenAdd = () => { setEditingVehicle(null); setShowModal(true) }
  const handleOpenEdit = (v) => { setEditingVehicle(v); setShowModal(true) }

  const handleDeleteVehicle = async (vehicle) => {
    const ok = await confirm({
      title: `Elimina ${vehicle.name}`,
      message: 'Verranno eliminati anche tutti i dati di spesa e manutenzione associati a questo veicolo. Continuare?',
      variant: 'danger',
      confirmText: 'Elimina',
      cancelText: 'Annulla',
    })
    if (!ok) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('vehicles').delete().eq('id', vehicle.id).eq('user_id', user.id)
      if (error) throw error
      toast.success(`${vehicle.name} rimosso dal garage`)
      fetchVehicles()
    } catch (err) {
      console.error(err); toast.error('Errore durante l\'eliminazione')
    }
  }

  // ── DB not set up yet ───────────────────────────────────────
  if (dbError) {
    return (
      <>
        <Header title="Garage" />
        <PageWrapper>
          <Card padding="lg" className="border-red-500/20 bg-red-500/5 max-w-lg mx-auto">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <Car size={22} />
              <h3 className="text-base font-black">Database non configurato</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
              Esegui il file{' '}
              <code className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded font-mono text-xs">create_vehicles_table.sql</code>
              {' '}nel tuo SQL Editor Supabase per abilitare il Garage.
            </p>
            <div className="bg-[var(--bg-elevated)] rounded-xl p-4 border border-[var(--border-subtle)]">
              <ol className="text-xs text-[var(--text-secondary)] space-y-1 list-decimal pl-4">
                <li>Apri <strong>create_vehicles_table.sql</strong> dalla root del progetto</li>
                <li>Incolla lo script nel SQL Editor Supabase ed esegui</li>
                <li>Ricarica questa pagina</li>
              </ol>
            </div>
          </Card>
        </PageWrapper>
      </>
    )
  }

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Header title="Garage" />
        <PageWrapper>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--text-muted)]">Caricamento garage...</p>
          </div>
        </PageWrapper>
      </>
    )
  }

  // ── Empty state: no vehicles yet ────────────────────────────
  if (vehicles.length === 0) {
    return (
      <>
        <Header
          title="Garage"
          actions={
            <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Aggiungi Auto
            </Button>
          }
        />
        <PageWrapper>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-6"
            >
              <div className="w-20 h-20 rounded-[var(--radius-xl)] bg-[var(--color-primary-ghost)] flex items-center justify-center mx-auto">
                <Car size={36} className="text-[var(--color-primary)]" />
              </div>
            </motion.div>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Il tuo garage è vuoto
            </h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xs mb-6 leading-relaxed">
              Aggiungi la tua prima auto per iniziare a tracciare spese, manutenzioni e consumo.
            </p>
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Aggiungi la tua prima auto
            </Button>
          </motion.div>
        </PageWrapper>
        <AnimatePresence>
          {showModal && (
            <AddVehicleModal onClose={() => setShowModal(false)} onSaved={fetchVehicles} vehicle={editingVehicle} />
          )}
        </AnimatePresence>
      </>
    )
  }

  // ── Main view ───────────────────────────────────────────────
  return (
    <>
      <Header
        title="Garage"
        actions={
          <div className="flex items-center gap-1.5">
            {activeVehicle && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleDeleteVehicle(activeVehicle)}
                className="text-[var(--color-danger)] hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Rimuovi
              </Button>
            )}
            <Button size="xs" variant="primary" icon={Plus} onClick={handleOpenAdd}>Auto</Button>
          </div>
        }
      />

      <PageWrapper>
        <div className="space-y-1">
          {/* ── Carousel ── */}
          <VehicleCarousel
            vehicles={vehicles}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onAdd={handleOpenAdd}
            onEdit={handleOpenEdit}
          />

          {/* ── Dashboard per auto attiva ── */}
          {activeVehicle && (
            <VehicleDashboard vehicle={activeVehicle} />
          )}
        </div>
      </PageWrapper>

      {/* ── Modal add/edit ── */}
      <AnimatePresence>
        {showModal && (
          <AddVehicleModal
            onClose={() => { setShowModal(false); setEditingVehicle(null) }}
            onSaved={() => {
              fetchVehicles()
              // Dopo aggiunta, porta il focus sull'ultima auto
              if (!editingVehicle) setTimeout(() => setActiveIndex(vehicles.length), 100)
            }}
            vehicle={editingVehicle}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Veicolo
