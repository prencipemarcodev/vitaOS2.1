import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatters'

const COLORS = ['#3d9970', '#4a90d9', '#ff851b', '#9b59b6', '#e05252', '#f012be', '#001f3f', '#39cccc']

function DistributionPie({ title, data, type }) {
  if (data.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-[var(--border-subtle)] rounded-2xl opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-widest">{title}</p>
        <p className="text-[10px] italic">Nessun dato</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">{title}</h4>
      <div className="h-[140px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={35}
              outerRadius={55}
              paddingAngle={4}
              dataKey="value"
              animationBegin={0}
              animationDuration={1200}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
      <div className="space-y-1 mt-2 px-1">
        {data.slice(0, 3).map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span className="text-[9px] font-bold text-[var(--text-primary)] truncate uppercase tracking-tight">{item.name}</span>
            </div>
            <span className="text-[9px] font-medium text-[var(--text-muted)] shrink-0">{formatCurrency(item.value)}</span>
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
      const cat = categories.find(c => c.id === tx.category_id)
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
      const cat = categories.find(c => c.id === tx.category_id)
      const name = cat?.name || 'Stipendio'
      acc[name] = (acc[name] || 0) + parseFloat(tx.amount)
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, categories])

  return (
    <Card padding="md" className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Ripartizione Mensile</h3>
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase bg-[var(--bg-base)] px-2 py-1 rounded-lg border border-[var(--border-subtle)]">Analisi Categorie</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-4">
        <DistributionPie title="Distribuzione Uscite" data={expenseData} type="expense" />
        <DistributionPie title="Distribuzione Entrate" data={incomeData} type="income" />
      </div>
    </Card>
  )
}

export default FinanceDistribution
