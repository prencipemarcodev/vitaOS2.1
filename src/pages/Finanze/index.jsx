import { useState, useMemo, useEffect } from 'react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAppStore } from '@/store/useAppStore'
import { useLocation } from 'react-router-dom'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Plus, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import TransactionList from './TransactionList'
import TransactionModal from './TransactionModal'
import BalanceChart from './BalanceChart'
import FinanceDistribution from './FinanceDistribution'
import BudgetTracker from './BudgetTracker'
import SubscriptionManager from './SubscriptionManager'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function Finanze() {
  const { transactions, categories, loading } = useFinanceStore()
  const { userConfig } = useAppStore()
  const location = useLocation()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [activeTab, setActiveTab] = useState('panoramica') // 'panoramica' | 'abbonamenti'
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState('all')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'new-transaction') {
      setEditingTx(null)
      setModalOpen(true)
    }
  }, [location.search])

  const filteredTransactions = useMemo(() => {
    if (selectedAccount === 'all') return transactions
    return transactions.filter(t => t.payment_method === selectedAccount)
  }, [transactions, selectedAccount])

  const kpis = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    return { income, expense, net: income - expense }
  }, [filteredTransactions])

  // Alert budget quando si sfora l'80%
  useEffect(() => {
    const expenseCategories = categories.filter(c => c.type === 'expense' && parseFloat(c.budget_limit || 0) > 0)
    const spentMap = transactions.filter(t => t.type === 'expense').reduce((acc, tx) => {
      const key = tx.category?.toString()
      acc[key] = (acc[key] || 0) + parseFloat(tx.amount || 0)
      return acc
    }, {})

    expenseCategories.forEach(cat => {
      const spent = spentMap[cat.id?.toString()] || 0
      const limit = parseFloat(cat.budget_limit)
      const pct = (spent / limit) * 100
      if (pct >= 80 && pct < 100) {
        toast(`Budget ${cat.name} quasi esaurito`, {
          description: `Hai speso ${formatCurrency(spent)} su ${formatCurrency(limit)} (${pct.toFixed(0)}%)`,
          icon: <AlertTriangle size={16} className="text-orange-500" />,
          duration: 6000,
        })
      } else if (pct >= 100) {
        toast.error(`Budget ${cat.name} superato!`, {
          description: `Hai sforato di ${formatCurrency(spent - limit)}`,
          duration: 8000,
        })
      }
    })
  }, [transactions.length, categories])

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
          activeTab === 'panoramica' ? (
            <Button 
              variant="ghost" 
              size="sm" 
              icon={Plus} 
              onClick={() => { setEditingTx(null); setModalOpen(true) }}
              className="font-bold !text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
              hideTextMobile
            >
              Nuovo Movimento
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              icon={Plus} 
              onClick={() => setShowAddForm(true)}
              className="font-bold !text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
              hideTextMobile
            >
              Nuovo Abbonamento
            </Button>
          )
        }
      />

      <PageWrapper>
        <div className="space-y-4 lg:h-full flex flex-col lg:overflow-hidden">
          {/* Top Row: KPIs - Optimized for mobile space */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 shrink-0">
            <Card padding="sm" className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center shrink-0 text-[var(--text-muted)] ml-1">
                <ArrowUpRight size={18} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[10px] font-bold text-[var(--text-muted)] uppercase truncate">Entrate</p>
                <p className="text-xs sm:text-sm font-bold text-[#3d9970] truncate">{formatCurrency(kpis.income)}</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center shrink-0 text-[var(--text-muted)] ml-1">
                <ArrowDownLeft size={18} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[10px] font-bold text-[var(--text-muted)] uppercase truncate">Uscite</p>
                <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{formatCurrency(kpis.expense)}</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center shrink-0 text-[var(--text-muted)] ml-1">
                <Wallet size={18} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[10px] font-bold text-[var(--text-muted)] uppercase truncate">Mensile</p>
                <p className={`text-xs sm:text-sm font-bold truncate ${kpis.net >= 0 ? 'text-[#3d9970]' : 'text-[#e05252]'}`}>
                  {kpis.net >= 0 ? '+' : ''}{formatCurrency(kpis.net)}
                </p>
              </div>
            </Card>
          </div>

          {/* Tab Switcher & Account Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-subtle)] pb-2 shrink-0 gap-3">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('panoramica')}
                className={`text-sm font-bold pb-1 transition-all relative ${
                  activeTab === 'panoramica' 
                    ? 'text-[var(--text-primary)]' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Panoramica
                {activeTab === 'panoramica' && (
                  <span className="absolute bottom-[-11px] left-0 right-0 h-[2px] bg-[var(--color-primary)] rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('abbonamenti')}
                className={`text-sm font-bold pb-1 transition-all relative ${
                  activeTab === 'abbonamenti' 
                    ? 'text-[var(--text-primary)]' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Abbonamenti
                {activeTab === 'abbonamenti' && (
                  <span className="absolute bottom-[-11px] left-0 right-0 h-[2px] bg-[var(--color-primary)] rounded-full" />
                )}
              </button>
            </div>
            
            {activeTab === 'panoramica' && (
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">Conto:</span>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none px-3 py-1 cursor-pointer"
                >
                  <option value="all">🌍 Tutti i conti</option>
                  <option value="bank">🏦 Banco</option>
                  <option value="cash">💵 Contanti</option>
                  <option value="revolut">💳 Revolut</option>
                  <option value="postepay">💳 PostePay</option>
                </select>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'panoramica' ? (
              <motion.div
                key="panoramica"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-h-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0 space-y-4"
              >
                <div className="lg:col-span-2 space-y-4 lg:overflow-y-auto pr-1 pb-4">
                  <BalanceChart userConfig={userConfig} selectedAccount={selectedAccount} />
                  <BudgetTracker transactions={filteredTransactions} categories={categories} />
                  <FinanceDistribution transactions={filteredTransactions} categories={categories} />
                </div>
                <div className="flex flex-col lg:h-full min-h-0 lg:overflow-hidden">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Transazioni</h3>
                  </div>
                  <div className="flex-1 lg:overflow-y-auto pr-1 pb-4">
                    <TransactionList transactions={filteredTransactions} categories={categories} onEdit={handleEdit} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="abbonamenti"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto pr-1 pb-4"
              >
                <SubscriptionManager showAddForm={showAddForm} setShowAddForm={setShowAddForm} />
              </motion.div>
            )}
          </AnimatePresence>
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
