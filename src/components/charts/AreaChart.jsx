import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export function AreaChartWidget({
  data,
  lines = [],           // [{ key, color, label }]
  xKey = 'date',
  height = '100%',
  gradient = true,
  grid = true,
  formatX,
  formatY,
  formatTooltip,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReAreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          {lines.map((l) => (
            <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={l.color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={l.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {grid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatX}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatY}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            boxShadow: 'var(--shadow-md)',
          }}
          formatter={formatTooltip}
        />
        {lines.map((l) => (
          <Area
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.label}
            stroke={l.color}
            strokeWidth={2}
            fill={gradient ? `url(#grad-${l.key})` : 'none'}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={800}
          />
        ))}
        {lines.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />}
      </ReAreaChart>
    </ResponsiveContainer>
  )
}
