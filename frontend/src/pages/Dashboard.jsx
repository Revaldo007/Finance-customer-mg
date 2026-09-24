import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import {
  Users,
  HandCoins,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  BadgeCheck,
  ShieldAlert,
} from 'lucide-react'
import client from '../api/client'

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const STAT_CONFIGS = [
  { key: 'total_customers',        label: 'Total Customers',      Icon: Users,        fmt: (v) => v, accent: '#0284c7' },
  { key: 'total_amount_provided',  label: 'Amount Provided',      Icon: HandCoins,    fmt: inr,       accent: '#4f46e5' },
  { key: 'total_collected',        label: 'Total Collected',      Icon: CheckCircle2, fmt: inr,       accent: '#059669' },
  { key: 'total_outstanding',      label: 'Outstanding',          Icon: AlertTriangle,fmt: inr,       accent: '#d97706' },
  { key: 'active_accounts',        label: 'Active Accounts',      Icon: FolderKanban, fmt: (v) => v, accent: '#0f766e' },
  { key: 'completed_accounts',     label: 'Completed Accounts',   Icon: BadgeCheck,   fmt: (v) => v, accent: '#4338ca' },
  { key: 'overdue_accounts',       label: 'Overdue Accounts',     Icon: ShieldAlert,  fmt: (v) => v, accent: '#dc2626' },
]

function StatCard({ config, value }) {
  const display = value !== undefined && value !== null ? config.fmt(value) : '—'
  const IconComponent = config.Icon
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      border: '1px solid #e8ebf0',
      borderLeft: `3px solid ${config.accent}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '14px',
      transition: 'box-shadow 0.18s, border-color 0.18s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,23,42,0.09)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)' }}
    >
      <div>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
          {config.label}
        </p>
        <p style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '4px 0 0', lineHeight: 1.1 }}>
          {display}
        </p>
      </div>
      <div style={{
        width: 38, height: 38, borderRadius: '10px',
        background: `${config.accent}14`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <IconComponent size={19} color={config.accent} strokeWidth={2} />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(15,23,42,0.1)', fontSize: '12px' }}>
      <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0', fontWeight: 600 }}>
          {p.name}: {inr(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [trend, setTrend] = useState([])

  useEffect(() => {
    client.get('/dashboard/summary').then((r) => setSummary(r.data))
    client.get('/dashboard/upcoming-payments').then((r) => setUpcoming(r.data))
    client.get('/dashboard/monthly-trend').then((r) => setTrend(r.data.map(d => ({
      name: `${d.month}/${d.year}`, Disbursed: d.disbursed, Collected: d.collected,
    }))))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '3px 0 0' }}>Overview of customers, finance accounts and repayments</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>
        {STAT_CONFIGS.map(cfg => (
          <StatCard key={cfg.key} config={cfg} value={summary?.[cfg.key]} />
        ))}
      </div>

      {/* Chart + Upcoming */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Chart */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '22px 24px',
          boxShadow: '0 4px 24px rgba(15,23,42,0.07)', border: '1px solid #f1f5f9',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Monthly Disbursement vs Collection</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>Last 6 months trend</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="disbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3763f4" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3763f4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
              <Line type="monotone" dataKey="Disbursed" stroke="#3763f4" strokeWidth={2.5} dot={{ r: 3, fill: '#3763f4' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Collected" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: '#22c55e' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Payments */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '22px 24px',
          boxShadow: '0 4px 24px rgba(15,23,42,0.07)', border: '1px solid #f1f5f9',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Upcoming Payments</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>Payments due soon or overdue</p>
          </div>

          {upcoming.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
              <CheckCircle2 size={36} color="#16a34a" />
              <p style={{ fontSize: '13px', margin: '8px 0 0', fontWeight: 500, color: '#64748b' }}>All clear! No payments due soon.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcoming.map((u) => (
                <div key={u.finance_account_id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: '12px',
                  background: u.overdue ? 'linear-gradient(135deg,#fee2e2,#fef2f2)' : 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
                  border: u.overdue ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: u.overdue ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#3763f4,#6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '13px', fontWeight: 700,
                    }}>
                      {u.customer_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{u.customer_name}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Account #{u.finance_account_id}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: u.overdue ? '#ef4444' : '#1e293b', margin: 0 }}>{inr(u.amount_due)}</p>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '2px 8px', borderRadius: '999px',
                      background: u.overdue ? '#fef2f2' : '#f0fdf4',
                      color: u.overdue ? '#b91c1c' : '#15803d',
                      border: u.overdue ? '1px solid #fca5a5' : '1px solid #86efac',
                    }}>
                      {u.overdue ? 'Overdue' : `Due in ${u.days_remaining}d`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}