import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function DonutChartWidget({
  data,            // [{ name, value, color }]
  innerRadius = '60%',
  outerRadius = '85%',
  height = '100%',
  showLegend = true,
  centerLabel,     // { value, label }
}) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
            }}
            formatter={(value, name) => [
              `${((value / total) * 100).toFixed(1)}% — €${value.toFixed(2)}`,
              name,
            ]}
          />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-semibold text-[var(--text-primary)] font-num">
            {centerLabel.value}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{centerLabel.label}</span>
        </div>
      )}
    </div>
  )
}
