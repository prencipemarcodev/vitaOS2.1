import { useState, useCallback } from 'react'
import { Plus, X, RefreshCw } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toggle from '@/components/ui/Toggle'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import clsx from 'clsx'

function FinanceSection() {
  const { categories, addCategory, removeCategory } = useFinanceStore()
  const { userConfig, setUserConfig } = useAppStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', type: 'expense', icon: '📋', color: '#95a5a6', is_periodic: false, periodic_amount: '', periodic_day: 1 })

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const handleAdd = async () => {
    if (!newCat.name.trim()) return
    const { data, error } = await supabase.from('finance_categories').insert({
      name: newCat.name,
      type: newCat.type,
      icon: newCat.icon,
      color: newCat.color,
      is_default: false,
      is_periodic: newCat.is_periodic,
      periodic_amount: newCat.is_periodic ? parseFloat(newCat.periodic_amount) || 0 : null,
      periodic_day: newCat.is_periodic ? newCat.periodic_day : null,
    }).select().single()

    if (data) {
      addCategory(data)
      setNewCat({ name: '', type: 'expense', icon: '📋', color: '#95a5a6', is_periodic: false, periodic_amount: '', periodic_day: 1 })
      setShowAdd(false)
    }
  }

  const handleDelete = async (id) => {
    await supabase.from('finance_categories').delete().eq('id', id)
    removeCategory(id)
  }

  const saveSaldo = async (field, value) => {
    if (!userConfig?.id) return
    setUserConfig({ ...userConfig, [field]: value })
    await supabase.from('user_config').update({ [field]: value }).eq('id', userConfig.id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Finanze
        </h3>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Categorie personalizzate, periodici e saldi iniziali
        </p>
      </div>

      {/* Saldi iniziali */}
      <Card padding="lg" className="space-y-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">Saldi iniziali</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Conto"
            type="number"
            prefix="€"
            value={userConfig?.initial_bank_balance || ''}
            onChange={(e) => saveSaldo('initial_bank_balance', parseFloat(e.target.value) || 0)}
          />
          <Input
            label="Contante"
            type="number"
            prefix="€"
            value={userConfig?.initial_cash_balance || ''}
            onChange={(e) => saveSaldo('initial_cash_balance', parseFloat(e.target.value) || 0)}
          />
        </div>
      </Card>

      {/* Categorie Entrate */}
      <Card padding="lg" className="space-y-3">
        <p className="text-sm font-medium text-[var(--color-success)]">📥 Categorie Entrate</p>
        <div className="flex flex-wrap gap-1.5">
          {incomeCategories.map((cat) => (
            <CategoryPill key={cat.id} cat={cat} onDelete={!cat.is_default ? () => handleDelete(cat.id) : null} />
          ))}
        </div>
      </Card>

      {/* Categorie Uscite */}
      <Card padding="lg" className="space-y-3">
        <p className="text-sm font-medium text-[var(--color-danger)]">📤 Categorie Uscite</p>
        <div className="flex flex-wrap gap-1.5">
          {expenseCategories.map((cat) => (
            <CategoryPill key={cat.id} cat={cat} onDelete={!cat.is_default ? () => handleDelete(cat.id) : null} />
          ))}
        </div>
      </Card>

      {/* Add button */}
      <Button variant="primary_ghost" size="md" icon={Plus} onClick={() => setShowAdd(true)} className="w-full">
        Aggiungi categoria
      </Button>

      {/* Add modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Nuova categoria" footer={
        <>
          <Button variant="ghost" onClick={() => setShowAdd(false)}>Annulla</Button>
          <Button variant="primary" onClick={handleAdd}>Aggiungi</Button>
        </>
      }>
        <div className="space-y-4">
          <Input label="Nome" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="es. Hobby" />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Tipo</label>
              <select value={newCat.type} onChange={(e) => setNewCat({ ...newCat, type: e.target.value })}
                className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm px-3">
                <option value="income">Entrata</option>
                <option value="expense">Uscita</option>
              </select>
            </div>
            <Input label="Icona" value={newCat.icon} onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })} containerClassName="w-20" />
            <div className="w-20">
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Colore</label>
              <input type="color" value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] cursor-pointer" />
            </div>
          </div>
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <Toggle label="Periodica (ricorrente)" checked={newCat.is_periodic} onChange={(v) => setNewCat({ ...newCat, is_periodic: v })} />
            {newCat.is_periodic && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Input label="Importo" type="number" prefix="€" value={newCat.periodic_amount} onChange={(e) => setNewCat({ ...newCat, periodic_amount: e.target.value })} />
                <Input label="Giorno del mese" type="number" min={1} max={31} value={newCat.periodic_day} onChange={(e) => setNewCat({ ...newCat, periodic_day: parseInt(e.target.value) })} />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

function CategoryPill({ cat, onDelete }) {
  return (
    <span
      className="inline-flex items-center gap-1 pl-2 pr-1 h-7 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
    >
      <span>{cat.icon}</span>
      <span>{cat.name}</span>
      {cat.is_periodic && <RefreshCw size={10} className="ml-0.5 opacity-60" />}
      {onDelete && (
        <button onClick={onDelete} className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 transition-colors">
          <X size={10} />
        </button>
      )}
    </span>
  )
}

export default FinanceSection
