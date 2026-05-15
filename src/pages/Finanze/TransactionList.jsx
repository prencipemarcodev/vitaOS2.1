import { Trash2, Edit2, Wallet } from 'lucide-react'
import { getIcon } from '@/lib/icons'
import { formatCurrency } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useNotifications } from '@/hooks/useNotifications'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import Card from '@/components/ui/Card'
import clsx from 'clsx'

function TransactionList({ transactions, categories, onEdit }) {
  const { removeTransaction } = useFinanceStore()
  const { pushError, pushSuccess } = useNotifications()

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questa transazione?')) return
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      pushError('Errore nell\'eliminazione')
    } else {
      removeTransaction(id)
      toast.success('Transazione eliminata')
      pushSuccess('Transazione eliminata', 'trash')
    }
  }

  if (transactions.length === 0) {
    return (
      <Card padding="lg" className="flex flex-col items-center justify-center text-center opacity-40">
        <Wallet size={32} className="mb-2" />
        <p className="text-xs font-bold">Nessun movimento questo mese</p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const category = categories.find(c => c.id === tx.category)
        const CategoryIcon = category ? getIcon(category.icon) : Wallet
        return (
          <Card key={tx.id} padding="sm" className="group hover:bg-[var(--bg-elevated)] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={clsx(
                   'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[var(--border-subtle)]',
                   tx.type === 'income' ? 'bg-[#3d997008] text-[#3d9970]' : 'bg-[#e0525208] text-[#e05252]'
                )}>
                  <CategoryIcon size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      {category?.name || 'Altro'}
                    </p>
                    <span className="text-[8px] font-bold text-[var(--text-muted)] opacity-50">•</span>
                    <p className="text-[10px] font-medium text-[var(--text-muted)]">
                      {format(parseISO(tx.date), 'dd MMM', { locale: it })}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[140px] lg:max-w-[200px]">
                    {tx.description || (tx.type === 'income' ? 'Entrata' : 'Uscita')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p className={clsx(
                  'text-sm font-bold',
                  tx.type === 'income' ? 'text-[#3d9970]' : 'text-[var(--text-primary)]'
                )}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
                
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(tx)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-primary)]">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(tx.id)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-danger)]">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default TransactionList
