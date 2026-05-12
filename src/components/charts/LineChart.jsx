import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export function LineChartWidget({
  data,
  lines = [],          // [{ key, color, label, dashed? }]
  xKey = 'date',
  referenceLines = [], // [{ y, color, label }]
  height = '100%',
  formatX,
  formatY,
  formatTooltip,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
        />
        {referenceLines.map((rl, i) => (
          <ReferenceLine
            key={i}
            y={rl.y}
            stroke={rl.color || 'var(--text-muted)'}
            strokeDasharray="4 4"
            label={{ value: rl.label, fill: 'var(--text-muted)', fontSize: 10 }}
          />
        ))}
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.label}
            stroke={l.color}
            strokeWidth={2}
            strokeDasharray={l.dashed ? '5 5' : undefined}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={800}
          />
        ))}
        {lines.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />}
      </ReLineChart>
    </ResponsiveContainer>
  )
}
