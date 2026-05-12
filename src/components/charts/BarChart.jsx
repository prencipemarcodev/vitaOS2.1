import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export function BarChartWidget({
  data,
  bars = [],           // [{ key, color, label, stackId? }]
  xKey = 'date',
  referenceLine,       // { value, label }
  height = '100%',
  formatX,
  formatY,
  formatTooltip,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
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
          cursor={{ fill: 'var(--bg-elevated)' }}
        />
        {referenceLine && (
          <ReferenceLine
            y={referenceLine.value}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            label={{ value: referenceLine.label, fill: 'var(--text-muted)', fontSize: 10, position: 'insideTopRight' }}
          />
        )}
        {bars.map((b) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.label}
            fill={b.color}
            radius={[4, 4, 0, 0]}
            stackId={b.stackId}
            animationDuration={800}
          />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  )
}
