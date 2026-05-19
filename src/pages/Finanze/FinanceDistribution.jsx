import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatters'

const EXPENSE_COLORS = ['#ff851b', '#e05252', '#ff4136', '#ffdc00', '#85144b', '#f012be']
const INCOME_COLORS = ['#3d9970', '#2ecc40', '#0074d9', '#7fdbff', '#39cccc', '#01ff70']

function DistributionPie({ title, data, colors }) {
  if (data.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-[var(--border-subtle)] rounded-3xl opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <p className="text-[10px] italic">Nessun dato</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 px-1">{title}</h4>
      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={45}
              outerRadius={65}
              paddingAngle={4}
              dataKey="value"
              animationBegin={0}
              animationDuration={1200}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-[var(--border-subtle)] p-3 shadow-2xl rounded-2xl">
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1 tracking-widest">{payload[0].name}</p>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(payload[0].value)}</p>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 mt-4 px-1">
        {data.slice(0, 4).map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
              <span className="text-[10px] font-bold text-[var(--text-primary)] truncate uppercase tracking-tight">{item.name}</span>
            </div>
            <span className="text-[10px] font-medium text-[var(--text-muted)] shrink-0">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinanceDistribution({ transactions, categories }) {
  const expenseData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const grouped = expenses.reduce((acc, tx) => {
      // Usiamo toString() per assicurarci che il confronto funzioni se uno è numero e l'altro stringa
      const cat = categories.find(c => c.id?.toString() === tx.category?.toString())
      const name = cat?.name || 'Altro'
      acc[name] = (acc[name] || 0) + parseFloat(tx.amount)
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, categories])

  const incomeData = useMemo(() => {
    const incomes = transactions.filter(t => t.type === 'income')
    const grouped = incomes.reduce((acc, tx) => {
      const cat = categories.find(c => c.id?.toString() === tx.category?.toString())
      const name = cat?.name || 'Stipendio'
      acc[name] = (acc[name] || 0) + parseFloat(tx.amount)
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, categories])

  return (
    <Card padding="lg" className="flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Distribuzione</h3>
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase bg-[var(--bg-base)] px-2 py-1 rounded-lg border border-[var(--border-subtle)]">Analisi Categorie</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-6">
        <DistributionPie title="Uscite" data={expenseData} colors={EXPENSE_COLORS} />
        <DistributionPie title="Entrate" data={incomeData} colors={INCOME_COLORS} />
      </div>
    </Card>
  )
}


export default FinanceDistribution
