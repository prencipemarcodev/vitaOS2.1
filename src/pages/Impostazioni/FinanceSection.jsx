import { useState } from 'react'
import { Plus, X, RefreshCw, Edit2, Trash2, Coins } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAppStore } from '@/store/useAppStore'
import { useConfirmStore } from '@/store/useConfirmStore'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toggle from '@/components/ui/Toggle'
import Modal from '@/components/ui/Modal'
import clsx from 'clsx'
import { ICON_OPTIONS, getIcon } from '@/lib/icons'
import { getAccounts } from '@/lib/accounts'
import { toast } from 'sonner'

import BudgetConfig from './BudgetConfig'


function FinanceSection() {
  const { categories, addCategory, removeCategory } = useFinanceStore()
  const { userConfig, setUserConfig } = useAppStore()
  const { user } = useAuthStore()
  const confirm = useConfirmStore(s => s.confirm)
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', type: 'expense', icon: 'Clipboard', color: '#95a5a6', is_periodic: false, periodic_amount: '', periodic_day: 1 })

  const [editingAccId, setEditingAccId] = useState(null)
  const [editAccForm, setEditAccForm] = useState({ name: '', initial_balance: '', color: '#4a90d9', icon: 'CreditCard' })
  const [showAddAcc, setShowAddAcc] = useState(false)
  const [newAcc, setNewAcc] = useState({ name: '', initial_balance: '', color: '#3b82f6', icon: 'CreditCard' })

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const handleAdd = async () => {
    if (!newCat.name.trim()) return
    const { data, error } = await supabase.from('finance_categories').insert({
      user_id: user?.id,
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
      setNewCat({ name: '', type: 'expense', icon: 'Clipboard', color: '#95a5a6', is_periodic: false, periodic_amount: '', periodic_day: 1 })
      setShowAdd(false)
    }
  }

  const handleDelete = async (id) => {
    // Filtro anche per user_id per prevenire IDOR (VUL-003)
    await supabase.from('finance_categories').delete().eq('id', id).eq('user_id', user?.id)
    removeCategory(id)
  }

  const saveAccounts = async (updatedAccounts) => {
    if (!userConfig?.id) return

    const cashAcc = updatedAccounts.find(a => a.id === 'cash')
    const customList = updatedAccounts.filter(a => a.id !== 'cash')

    const customClean = customList.map(a => ({
      id: a.id,
      name: a.name,
      initial_balance: parseFloat(a.initial_balance) || 0,
      color: a.color,
      icon: a.icon
    }))

    const updatedConfig = {
      ...userConfig,
      custom_accounts: customClean
    }

    if (cashAcc) {
      updatedConfig.initial_cash_balance = parseFloat(cashAcc.initial_balance) || 0
    }

    setUserConfig(updatedConfig)

    try {
      const payload = {
        custom_accounts: customClean
      }
      if (cashAcc) {
        payload.initial_cash_balance = parseFloat(cashAcc.initial_balance) || 0
      }

      const { error } = await supabase
        .from('user_config')
        .update(payload)
        .eq('id', userConfig.id)

      if (error) {
        localStorage.setItem('vitaos_custom_accounts', JSON.stringify(customClean))
        console.warn("Failed remote update, synced to local storage", error)
        toast.info("Configurazione salvata localmente! 💳")
      } else {
        toast.success("Configurazione conti salvata! 💳")
      }
    } catch (e) {
      localStorage.setItem('vitaos_custom_accounts', JSON.stringify(customClean))
      console.error("Failed accounts save:", e)
      toast.info("Configurazione salvata localmente! 💳")
    }
  }

  const handleAddAccount = () => {
    if (!newAcc.name.trim()) {
      toast.error("Inserisci un nome valido")
      return
    }
    const accountsList = getAccounts(userConfig)
    const newId = 'acc_' + Date.now()
    const updated = [
      ...accountsList,
      {
        id: newId,
        name: newAcc.name,
        initial_balance: parseFloat(newAcc.initial_balance) || 0,
        color: newAcc.color,
        icon: newAcc.icon
      }
    ]
    saveAccounts(updated)
    setNewAcc({ name: '', initial_balance: '', color: '#3b82f6', icon: 'CreditCard' })
    setShowAddAcc(false)
  }

  const handleEditAccount = (acc) => {
    setEditingAccId(acc.id)
    setEditAccForm({
      name: acc.name,
      initial_balance: acc.initial_balance.toString(),
      color: acc.color,
      icon: acc.icon
    })
  }

  const handleSaveEditAccount = () => {
    if (!editAccForm.name.trim()) {
      toast.error("Inserisci un nome valido")
      return
    }
    const accountsList = getAccounts(userConfig)
    const updated = accountsList.map(a => {
      if (a.id === editingAccId) {
        return {
          ...a,
          name: editAccForm.name,
          initial_balance: parseFloat(editAccForm.initial_balance) || 0,
          color: editAccForm.color,
          icon: editAccForm.icon
        }
      }
      return a
    })
    saveAccounts(updated)
    setEditingAccId(null)
  }

  const handleDeleteAccount = async (id) => {
    if (id === 'cash') return
    const ok = await confirm({
      title: 'Elimina conto',
      message: 'Sei sicuro di voler eliminare questo conto? Le transazioni storiche registrate con questa modalità rimarranno tracciate ma il conto non sarà più selezionabile per nuovi movimenti.',
      variant: 'danger',
      confirmText: 'Elimina',
      cancelText: 'Annulla'
    })
    if (!ok) return
    const accountsList = getAccounts(userConfig)
    const updated = accountsList.filter(a => a.id !== id)
    saveAccounts(updated)
  }

  return (
    <div className="space-y-6">

      <BudgetConfig />

      {/* Saldi e Conti Iniziali */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-[var(--text-primary)]">Gestione Conti e Casse</p>
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
              Configura i tuoi conti bancari, carte di credito e la cassa fisica per tracciare le transazioni.
            </p>
          </div>
          <Button 
            variant="primary" 
            size="xs" 
            icon={Plus} 
            onClick={() => setShowAddAcc(!showAddAcc)}
          >
            Aggiungi Conto
          </Button>
        </div>

        {showAddAcc && (
          <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)] space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">Nuovo Conto</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nome"
                placeholder="es. N26, Satispay"
                value={newAcc.name}
                onChange={e => setNewAcc({ ...newAcc, name: e.target.value })}
              />
              <Input
                label="Saldo Iniziale"
                type="number"
                prefix="€"
                placeholder="0.00"
                value={newAcc.initial_balance}
                onChange={e => setNewAcc({ ...newAcc, initial_balance: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-secondary)] mb-1 block">Icona</label>
                <select
                  value={newAcc.icon}
                  onChange={e => setNewAcc({ ...newAcc, icon: e.target.value })}
                  className="w-full h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                >
                  <option value="Landmark">Landmark (🏦)</option>
                  <option value="CreditCard">CreditCard (💳)</option>
                  <option value="Wallet">Wallet (👛)</option>
                  <option value="PiggyBank">PiggyBank (🐷)</option>
                  <option value="Banknote">Banknote (💵)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--text-secondary)] mb-1 block">Colore</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={newAcc.color}
                    onChange={e => setNewAcc({ ...newAcc, color: e.target.value })}
                    className="w-9 h-9 rounded-xl border border-[var(--border-subtle)] cursor-pointer overflow-hidden"
                  />
                  <span className="text-xs font-mono text-[var(--text-secondary)] uppercase">{newAcc.color}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="xs" variant="ghost" onClick={() => setShowAddAcc(false)}>Annulla</Button>
              <Button size="xs" variant="primary" onClick={handleAddAccount}>Crea</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {getAccounts(userConfig).map((acc) => {
            const isEditing = editingAccId === acc.id
            const Icon = getIcon(acc.icon)
            
            return (
              <div 
                key={acc.id} 
                className="p-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                      Modifica {acc.is_permanent ? "Cassa" : "Conto"}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Nome"
                        value={editAccForm.name}
                        onChange={e => setEditAccForm({ ...editAccForm, name: e.target.value })}
                        disabled={acc.is_permanent}
                      />
                      <Input
                        label="Saldo Iniziale"
                        type="number"
                        prefix="€"
                        value={editAccForm.initial_balance}
                        onChange={e => setEditAccForm({ ...editAccForm, initial_balance: e.target.value })}
                      />
                    </div>
                    {!acc.is_permanent && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-[var(--text-secondary)] mb-1 block">Icona</label>
                          <select
                            value={editAccForm.icon}
                            onChange={e => setEditAccForm({ ...editAccForm, icon: e.target.value })}
                            className="w-full h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs px-3 focus:outline-none"
                          >
                            <option value="Landmark">Landmark (🏦)</option>
                            <option value="CreditCard">CreditCard (💳)</option>
                            <option value="Wallet">Wallet (👛)</option>
                            <option value="PiggyBank">PiggyBank (🐷)</option>
                            <option value="Banknote">Banknote (💵)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[var(--text-secondary)] mb-1 block">Colore</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={editAccForm.color}
                              onChange={e => setEditAccForm({ ...editAccForm, color: e.target.value })}
                              className="w-9 h-9 rounded-xl border border-[var(--border-subtle)] cursor-pointer"
                            />
                            <span className="text-xs font-mono text-[var(--text-secondary)] uppercase">{editAccForm.color}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="xs" variant="ghost" onClick={() => setEditingAccId(null)}>Annulla</Button>
                      <Button size="xs" variant="primary" onClick={handleSaveEditAccount}>Salva</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center border animate-[fade-in_0.2s_ease-out]"
                        style={{ backgroundColor: `${acc.color}08`, borderColor: `${acc.color}20`, color: acc.color }}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-[var(--text-primary)]">{acc.name}</p>
                          {acc.is_permanent && (
                            <span className="text-[7px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-amber-500/5 text-amber-500 border border-amber-500/20">
                              Permanente
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Saldo iniziale: €{acc.initial_balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleEditAccount(acc)}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] rounded-xl hover:bg-black/5"
                        title="Modifica"
                      >
                        <Edit2 size={14} />
                      </button>
                      {!acc.is_permanent && (
                        <button 
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="p-2 text-[var(--text-muted)] hover:text-[var(--color-danger)] rounded-xl hover:bg-black/5"
                          title="Elimina"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Categorie Entrate */}
      <Card padding="lg" className="space-y-3">
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">📥 Categorie Entrate</p>
        <div className="flex flex-wrap gap-1.5">
          {incomeCategories.map((cat) => (
            <CategoryPill key={cat.id} cat={cat} onDelete={!cat.is_default ? () => handleDelete(cat.id) : null} />
          ))}
        </div>
      </Card>

      {/* Categorie Uscite */}
      <Card padding="lg" className="space-y-3">
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">📤 Categorie Uscite</p>
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
            <div className="flex-1">
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Icona</label>
              <select 
                value={newCat.icon} 
                onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm px-3"
              >
                {ICON_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
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
  const Icon = getIcon(cat.icon)
  return (
    <span
      className="inline-flex items-center gap-1.5 pl-2 pr-1.5 h-7 rounded-full text-[11px] font-medium
        bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
    >
      <Icon size={12} style={{ color: cat.color }} />
      <span>{cat.name}</span>
      {cat.is_periodic && <RefreshCw size={9} className="ml-0.5 opacity-40" />}
      {onDelete && (
        <button onClick={onDelete} className="ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors">
          <X size={9} />
        </button>
      )}
    </span>
  )
}

export default FinanceSection
