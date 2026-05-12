import { LineChart, Line, ResponsiveContainer } from 'recharts'

/**
 * SparkLine — mini grafico sparkline per KPI card.
 */
export function SparkLine({ data, dataKey = 'value', color = 'var(--color-primary)', height = 40 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
