import { useState, useMemo } from 'react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAppStore } from '@/store/useAppStore'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Plus, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import TransactionList from './TransactionList'
import TransactionModal from './TransactionModal'
import BalanceChart from './BalanceChart'
import CategoryDonut from './CategoryDonut'

function Finanze() {
  const { transactions, categories, loading } = useFinanceStore()
  const { userConfig } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState(null)

  const kpis = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    return { income, expense, net: income - expense }
  }, [transactions])

  const handleEdit = (tx) => {
    setEditingTx(tx)
    setModalOpen(true)
  }

  return (
    <>
      <Header 
        title="Finanze" 
        showMonth 
        showNotification 
        actions={
          <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditingTx(null); setModalOpen(true) }}>
            Nuovo Movimento
          </Button>
        }
      />

      <PageWrapper>
        <div className="space-y-4 h-full flex flex-col overflow-hidden">
          {/* Top Row: KPIs */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <Card padding="sm" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#3d997010] text-[#3d9970] flex items-center justify-center shrink-0">
                <ArrowUpRight size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Entrate</p>
                <p className="text-sm font-bold text-[#3d9970]">{formatCurrency(kpis.income)}</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#e0525210] text-[#e05252] flex items-center justify-center shrink-0">
                <ArrowDownLeft size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Uscite</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(kpis.expense)}</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-ghost)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Mensile</p>
                <p className={`text-sm font-bold ${kpis.net >= 0 ? 'text-[#3d9970]' : 'text-[#e05252]'}`}>
                  {kpis.net >= 0 ? '+' : ''}{formatCurrency(kpis.net)}
                </p>
              </div>
            </Card>
          </div>

          <div className="flex-1 min-h-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0 space-y-4">
            {/* Left Column: Charts */}
            <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-1 pb-4">
              <BalanceChart transactions={transactions} userConfig={userConfig} />
              <CategoryDonut transactions={transactions} categories={categories} />
            </div>

            {/* Right Column: List */}
            <div className="flex flex-col h-full min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Movimenti</h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 pb-4">
                <TransactionList transactions={transactions} categories={categories} onEdit={handleEdit} />
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>

      <TransactionModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        txToEdit={editingTx} 
      />
    </>
  )
}

export default Finanze
