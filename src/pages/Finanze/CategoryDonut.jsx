import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatters'

const COLORS = ['#4a90d9', '#3d9970', '#ff851b', '#e05252', '#9b59b6', '#f012be', '#001f3f', '#39cccc']

function CategoryDonut({ transactions, categories }) {
  const chartData = useMemo(() => {
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

  if (chartData.length === 0) return null

  return (
    <Card padding="md" className="h-[240px] flex flex-col">
      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Uscite per Categoria</h3>
      <div className="flex-1 flex min-h-0">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-[var(--border-subtle)] p-2 shadow-xl rounded-lg">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{payload[0].name}</p>
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
        
        <div className="w-1/2 flex flex-col justify-center gap-2 overflow-y-auto pl-2">
          {chartData.slice(0, 5).map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-[10px] font-bold text-[var(--text-primary)] truncate">{item.name}</span>
              </div>
              <span className="text-[10px] font-medium text-[var(--text-muted)] shrink-0">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default CategoryDonut
