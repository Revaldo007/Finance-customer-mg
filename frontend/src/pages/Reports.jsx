import { useEffect, useState } from 'react'
import client from '../api/client'

const TABS = [
  { key: 'customers',    label: 'Customer Report',    icon: '👥' },
  { key: 'finance',      label: 'Finance Report',     icon: '💰' },
  { key: 'repayments',   label: 'Repayment Report',   icon: '💵' },
  { key: 'transactions', label: 'Transaction History',icon: '🔁' },
]

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const MONEY_KEYS = /amount|borrowed|outstanding|paid|payable|disbursed|collected/

const COL_LABELS = {
  full_name: 'Customer', customer_name: 'Customer', phone: 'Phone',
  num_accounts: 'Accounts', total_borrowed: 'Total Borrowed',
  total_outstanding: 'Total Outstanding', id: 'Account ID',
  amount_provided: 'Provided', total_payable: 'Payable',
  amount_paid: 'Paid', outstanding_amount: 'Outstanding',
  status: 'Status', payment_date: 'Date', note: 'Note',
  finance_account_id: 'Acct ID', type: 'Type', date: 'Date', amount: 'Amount',
}

const STATUS_BADGE = {
  active:    { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  completed: { bg: '#ede9fe', color: '#4338ca', border: '#c4b5fd' },
  overdue:   { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  default:   { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
}

function CellValue({ col, val }) {
  if (val === null || val === undefined) return <span style={{ color: '#cbd5e1' }}>—</span>

  // Money columns
  if (typeof val === 'number' && MONEY_KEYS.test(col)) {
    return <span style={{ fontWeight: 700, color: col.includes('outstanding') ? '#f97316' : col.includes('paid') || col.includes('collected') ? '#16a34a' : '#1e293b' }}>{inr(val)}</span>
  }

  // Status column
  if (col === 'status') {
    const cfg = STATUS_BADGE[val?.toLowerCase()] || STATUS_BADGE.default
    return (
      <span style={{
        padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        textTransform: 'capitalize',
      }}>{val}</span>
    )
  }

  // Type column
  if (col === 'type') {
    const isDisbursed = String(val).toLowerCase().includes('disburse')
    return (
      <span style={{
        padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
        background: isDisbursed ? '#ede9fe' : '#dcfce7',
        color: isDisbursed ? '#4338ca' : '#15803d',
        border: isDisbursed ? '1px solid #c4b5fd' : '1px solid #86efac',
        textTransform: 'capitalize',
      }}>{val}</span>
    )
  }

  return <span style={{ color: '#475569' }}>{String(val)}</span>
}

export default function Reports() {
  const [tab, setTab] = useState('customers')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    client.get(`/reports/${tab}`).then((r) => { setRows(r.data); setLoading(false) })
  }, [tab])

  const columns = {
    customers:    ['full_name', 'phone', 'num_accounts', 'total_borrowed', 'total_outstanding'],
    finance:      ['id', 'customer_name', 'amount_provided', 'total_payable', 'amount_paid', 'outstanding_amount', 'status'],
    repayments:   ['id', 'customer_name', 'payment_date', 'amount_paid', 'note'],
    transactions: ['type', 'date', 'customer_name', 'finance_account_id', 'amount'],
  }[tab]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Reports</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '3px 0 0' }}>Customer, finance, repayment and transaction reports</p>
      </div>

      {/* Tab Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.18s',
                background: active ? 'linear-gradient(135deg,#3763f4,#2a4fd6)' : '#fff',
                color: active ? '#fff' : '#64748b',
                boxShadow: active ? '0 4px 14px rgba(55,99,244,0.3)' : '0 1px 4px rgba(15,23,42,0.08)',
                outline: active ? 'none' : '1px solid #e2e8f0',
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Table Card */}
      <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(15,23,42,0.07)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        {/* Column Headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
          padding: '12px 20px', background: 'linear-gradient(to right,#f8fafc,#f1f5f9)',
          borderBottom: '1px solid #e2e8f0',
        }}>
          {columns.map((c) => (
            <span key={c} style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {COL_LABELS[c] || c.replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, fontWeight: 500 }}>No data available</p>
          </div>
        ) : (
          rows.map((row, i) => (
            <div
              key={i}
              className="finance-row-enter"
              style={{
                display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
                padding: '13px 20px', borderBottom: i < rows.length - 1 ? '1px solid #f8fafc' : 'none',
                alignItems: 'center', transition: 'background 0.15s',
                animationDelay: `${i * 0.03}s`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map((c) => (
                <div key={c} style={{ fontSize: '13px', paddingRight: '8px' }}>
                  <CellValue col={c} val={row[c]} />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
