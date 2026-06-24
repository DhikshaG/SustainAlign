import { Card } from '../ui/Card'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const COLORS = ['#059669', '#0d9488', '#0891b2', '#0284c7', '#6366f1', '#8b5cf6', '#a855f7']

export function PieChartCard({ title, data, dataKey = 'value', nameKey = 'name', height = 240 }) {
  return (
    <Card>
      {title && <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => typeof v === 'number' ? `₹${(v / 100000).toFixed(1)}L` : v} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function AreaChartCard({ title, data, lines = [{ key: 'spent', color: '#059669', name: 'Spent' }], height = 240 }) {
  return (
    <Card>
      {title && <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
          <Tooltip formatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
          <Legend />
          {lines.map((line) => (
            <Area
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              fill={line.color}
              fillOpacity={0.15}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function BarChartCard({ title, data, bars = [{ key: 'score', color: '#059669', name: 'Score' }], xKey = 'name', height = 240 }) {
  return (
    <Card>
      {title && <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={data[0]?.name?.length > 12 ? 'vertical' : 'horizontal'}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          {data[0]?.name?.length > 12 ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11 }} width={120} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
            </>
          )}
          <Tooltip />
          <Legend />
          {bars.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} name={bar.name} fill={bar.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function LineChartCard({
  title,
  data,
  lines = [{ key: 'projected', color: '#059669', name: 'Projected' }],
  xKey = 'month',
  height = 240,
  yTickFormatter,
  tooltipFormatter,
}) {
  const formatY = yTickFormatter || ((v) => `${(v / 10000000).toFixed(1)}Cr`)
  const formatTip = tooltipFormatter || ((v) => (v ? `₹${(v / 10000000).toFixed(2)} Cr` : '—'))

  return (
    <Card>
      {title && <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={formatY} />
          <Tooltip formatter={formatTip} />
          <Legend />
          {lines.map((line) => (
            <Area key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} fill={line.color} fillOpacity={0.1} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
