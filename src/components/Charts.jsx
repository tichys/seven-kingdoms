import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

const COLORS = ['#c8a85a', '#dc3545', '#28a745', '#17a2b8', '#6f42c1', '#fd7e14', '#e83e8c', '#20c997']
const TOOLTIP_STYLE = { background: '#1a1a2e', border: '1px solid #3a3a5a', borderRadius: '4px', color: '#e0d8c8', fontSize: '0.8rem' }

export function RPProgressChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <defs>
          <linearGradient id="rpGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c8a85a" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#c8a85a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fill: '#88a', fontSize: 10 }} axisLine={{ stroke: '#3a3a5a' }} />
        <YAxis tick={{ fill: '#88a', fontSize: 10 }} axisLine={{ stroke: '#3a3a5a' }} />
        <CartesianGrid stroke="#2a2a4a" strokeDasharray="3 3" />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area type="monotone" dataKey="rp_score" stroke="#c8a85a" fill="url(#rpGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function EconomyPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fill: '#e0d8c8', fontSize: 10 }}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function WarStatsBar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <XAxis dataKey="name" tick={{ fill: '#88a', fontSize: 10 }} axisLine={{ stroke: '#3a3a5a' }} />
        <YAxis tick={{ fill: '#88a', fontSize: 10 }} axisLine={{ stroke: '#3a3a5a' }} />
        <CartesianGrid stroke="#2a2a4a" strokeDasharray="3 3" />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(200,168,90,0.05)' }} />
        <Bar dataKey="value" fill="#c8a85a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function HousePowerRadar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius={80}>
        <PolarGrid stroke="#3a3a5a" />
        <PolarAngleAxis dataKey="stat" tick={{ fill: '#88a', fontSize: 10 }} />
        <PolarRadiusAxis tick={{ fill: '#88a', fontSize: 8 }} axisLine={false} />
        <Radar name="Power" dataKey="value" stroke="#c8a85a" fill="#c8a85a" fillOpacity={0.3} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function SimpleLineChart({ data, dataKey = 'value', height = 200, color = '#c8a85a' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <XAxis dataKey="date" tick={{ fill: '#88a', fontSize: 10 }} axisLine={{ stroke: '#3a3a5a' }} />
        <YAxis tick={{ fill: '#88a', fontSize: 10 }} axisLine={{ stroke: '#3a3a5a' }} />
        <CartesianGrid stroke="#2a2a4a" strokeDasharray="3 3" />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
