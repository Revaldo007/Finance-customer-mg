import { useEffect, useState } from 'react'
import client from '../api/client'
import HealthBadge from '../components/HealthBadge.jsx'

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const FIELD_STYLE = {
  width: '100%',
  border: '1.5px solid #e2e8f0',
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#1e293b',
  outline: 'none',
  background: '#f8fafc',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
}

const LABEL_STYLE = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b',
  marginBottom: '5px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const DURATION_PRESETS = [
  { months: 3,  label: '3 Months (Quarterly)',   rate: 9 },
  { months: 6,  label: '6 Months (Half-Year)',    rate: 10 },
  { months: 9,  label: '9 Months (3 Quarters)',  rate: 11 },
  { months: 12, label: '12 Months (1 Year)',     rate: 12 },
  { months: 18, label: '18 Months (1.5 Years)',  rate: 13 },
  { months: 24, label: '24 Months (2 Years)',    rate: 14 },
  { months: 36, label: '36 Months (3 Years)',    rate: 15 },
  { months: 48, label: '48 Months (4 Years)',    rate: 16 },
  { months: 60, label: '60 Months (5 Years)',    rate: 18 },
]

export default function FinanceAccounts() {
  const [accounts, setAccounts] = useState([])
  const [customers, setCustomers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [isCustomDuration, setIsCustomDuration] = useState(false)
  const [form, setForm] = useState({
    customer_id: '', amount_provided: '', interest_rate: '', duration_months: '',
    start_date: new Date().toISOString().slice(0, 10),
  })
  const [healthMap, setHealthMap] = useState({})
  const [loading, setLoading] = useState(true)

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c.full_name]))

  const load = () => {
    setLoading(true)
    client.get('/finance-accounts').then((r) => {
      setAccounts(r.data)
      setLoading(false)
      r.data.forEach((a) => {
        client.get(`/finance-accounts/${a.id}/health`).then((h) =>
          setHealthMap((prev) => ({ ...prev, [a.id]: h.data }))
        )
      })
    })
  }

  useEffect(() => {
    load()
    client.get('/customers').then((r) => setCustomers(r.data))
  }, [])

  const filteredAccounts = accounts.filter((a) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const name = a.customer_name || customerMap[a.customer_id] || ''
    return (
      name.toLowerCase().includes(q) ||
      String(a.id).includes(q) ||
      `account #${a.id}`.toLowerCase().includes(q) ||
      (a.customer_phone && a.customer_phone.includes(q))
    )
  })

  const handleDurationPreset = (monthsVal) => {
    if (monthsVal === 'custom') {
      setIsCustomDuration(true)
      setForm(prev => ({ ...prev, duration_months: '' }))
      return
    }
    setIsCustomDuration(false)
    const preset = DURATION_PRESETS.find(p => p.months === Number(monthsVal))
    setForm(prev => ({
      ...prev,
      duration_months: monthsVal,
      interest_rate: preset ? String(preset.rate) : prev.interest_rate,
    }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    await client.post('/finance-accounts', {
      ...form,
      customer_id: Number(form.customer_id),
      amount_provided: Number(form.amount_provided),
      interest_rate: Number(form.interest_rate),
      duration_months: Number(form.duration_months),
    })
    setForm({
      customer_id: '', amount_provided: '', interest_rate: '', duration_months: '',
      start_date: new Date().toISOString().slice(0, 10),
    })
    setIsCustomDuration(false)
    setShowForm(false)
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
            Finance Accounts
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '3px 0 0', fontWeight: 400 }}>
            Loans &amp; accounts provided to customers
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{
            background: showForm
              ? 'linear-gradient(135deg, #f1f5f9, #e2e8f0)'
              : 'linear-gradient(135deg, #3763f4 0%, #2a4fd6 100%)',
            color: showForm ? '#64748b' : '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: showForm ? 'none' : '0 4px 14px rgba(55,99,244,0.35)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {showForm ? '✕ Cancel' : '+ New Account'}
        </button>
      </div>

      {/* ── New Account Form ── */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(15,23,42,0.08)',
            border: '1px solid #f1f5f9',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            animation: 'fadeInUp 0.25s ease',
          }}
        >
          <div style={{ gridColumn: '1 / -1' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
              Create New Account
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>Fill in the loan details below</p>
          </div>

          <div>
            <label style={LABEL_STYLE}>Customer</label>
            <select
              style={FIELD_STYLE}
              value={form.customer_id}
              required
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={LABEL_STYLE}>Start Date</label>
            <input
              type="date"
              style={FIELD_STYLE}
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>

          <div>
            <label style={LABEL_STYLE}>Amount Provided (₹)</label>
            <input
              type="number" step="0.01" required
              placeholder="e.g. 50000"
              style={FIELD_STYLE}
              value={form.amount_provided}
              onChange={(e) => setForm({ ...form, amount_provided: e.target.value })}
            />
          </div>

          {/* ── Duration – easy picking dropdown ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <label style={{ ...LABEL_STYLE, margin: 0 }}>Duration (Tenure)</label>
              {isCustomDuration && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDuration(false)
                    handleDurationPreset('12')
                  }}
                  style={{ background: 'none', border: 'none', color: '#3763f4', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  ← Presets
                </button>
              )}
            </div>

            {!isCustomDuration ? (
              <div style={{ position: 'relative' }}>
                <select
                  style={{
                    ...FIELD_STYLE,
                    appearance: 'none',
                    paddingRight: '32px',
                    cursor: 'pointer',
                    fontWeight: form.duration_months ? 600 : 400,
                    color: form.duration_months ? '#1e293b' : '#94a3b8',
                    border: form.duration_months ? '1.5px solid #3763f4' : '1.5px solid #e2e8f0',
                    background: form.duration_months ? 'linear-gradient(135deg,#eef4ff,#f8fafc)' : '#f8fafc',
                  }}
                  value={form.duration_months}
                  required
                  onChange={(e) => handleDurationPreset(e.target.value)}
                >
                  <option value="">Select loan duration…</option>
                  {DURATION_PRESETS.map((p) => (
                    <option key={p.months} value={p.months}>
                      {p.label} — {p.rate}% p.a.
                    </option>
                  ))}
                  <option value="custom">Custom duration in months…</option>
                </select>
                <span style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none', fontSize: '10px', color: '#94a3b8',
                }}>▼</span>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Number of months (e.g. 15)"
                  style={FIELD_STYLE}
                  value={form.duration_months}
                  onChange={(e) => {
                    const m = e.target.value
                    const match = DURATION_PRESETS.find(p => p.months === Number(m))
                    setForm(prev => ({
                      ...prev,
                      duration_months: m,
                      interest_rate: match ? String(match.rate) : prev.interest_rate,
                    }))
                  }}
                />
              </div>
            )}

            {/* Quick Tenure Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {[6, 12, 18, 24, 36, 60].map((m) => {
                const isSelected = !isCustomDuration && Number(form.duration_months) === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleDurationPreset(String(m))}
                    style={{
                      border: isSelected ? '1px solid #3763f4' : '1px solid #e2e8f0',
                      background: isSelected ? 'linear-gradient(135deg,#3763f4,#2563eb)' : '#f8fafc',
                      color: isSelected ? '#fff' : '#64748b',
                      borderRadius: '6px',
                      padding: '3px 9px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {m}M
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Interest Rate (% p.a.) – Auto-filled based on duration ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <label style={{ ...LABEL_STYLE, margin: 0 }}>Interest Rate (% p.a.)</label>
              {form.duration_months && (
                <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Auto-filled for {form.duration_months}M
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="number" step="0.01" required
                placeholder="e.g. 12"
                style={{
                  ...FIELD_STYLE,
                  background: form.interest_rate ? '#f0fdf4' : '#f8fafc',
                  border: form.interest_rate ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                  color: '#1e293b',
                  fontWeight: 600,
                  paddingRight: '30px',
                }}
                value={form.interest_rate}
                onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', pointerEvents: 'none', fontWeight: 600 }}>%</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
              Auto-filled standard rate; customizable if needed.
            </p>
          </div>

          {/* Live Loan Calculation Summary */}
          {form.amount_provided && form.duration_months && form.interest_rate && (() => {
            const p = Number(form.amount_provided)
            const r = Number(form.interest_rate)
            const m = Number(form.duration_months)
            if (p > 0 && r > 0 && m > 0) {
              const interest = p * (r / 100) * (m / 12)
              const total = p + interest
              const emi = total / m
              return (
                <div style={{
                  gridColumn: '1 / -1',
                  background: 'linear-gradient(135deg, #f0fdf4, #eff6ff)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.08)',
                }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Loan Calculation Breakdown
                    </span>
                    <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                      Principal: <strong>{inr(p)}</strong> • Total Interest: <strong>{inr(interest)}</strong> ({r}% p.a.)
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly Installment</p>
                      <p style={{ margin: '1px 0 0', fontSize: '16px', fontWeight: 800, color: '#15803d' }}>{inr(emi)} <span style={{ fontSize: '11px', fontWeight: 500 }}>/ mo</span></p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Payable</p>
                      <p style={{ margin: '1px 0 0', fontSize: '16px', fontWeight: 800, color: '#1e40af' }}>{inr(total)}</p>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })()}

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #3763f4 0%, #2a4fd6 100%)',
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '9px 22px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(55,99,244,0.35)',
              }}
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {/* ── Search Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <input
            type="text"
            placeholder="Search by account # or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              outline: 'none',
              background: '#fff',
              boxSizing: 'border-box',
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}>🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
            >✕</button>
          )}
        </div>
        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
          Showing {filteredAccounts.length} of {accounts.length} accounts
        </span>
      </div>

      {/* ── Accounts Table ── */}
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(15,23,42,0.07)',
          border: '1px solid #f1f5f9',
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 1fr 1fr 1.3fr 1.2fr',
            padding: '12px 20px',
            background: 'linear-gradient(to right, #f8fafc, #f1f5f9)',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          {['Account & Customer', 'Provided', 'Total Payable', 'Outstanding / Fine', 'Health'].map((h) => (
            <span
              key={h}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#cbd5e1', fontSize: '13px' }}>
            Loading accounts…
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
              {search ? 'No matching finance accounts found' : 'No finance accounts yet'}
            </p>
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '4px 0 0' }}>
              {search ? 'Try clearing your search query' : 'Click "New Account" to get started'}
            </p>
          </div>
        ) : (
          filteredAccounts.map((a, idx) => {
            const outstanding = Number(a.outstanding_amount || 0)
            const health = healthMap[a.id]
            const isOverdue = a.is_overdue && a.status !== 'completed'
            const daysOverdue = a.days_overdue || 0
            const lateFine = a.late_fine_amount || 0
            const totalDue = a.total_due_now || (a.monthly_installment + lateFine)
            return (
              <div
                key={a.id}
                className="finance-row-enter"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.2fr 1fr 1fr 1.3fr 1.2fr',
                  padding: '14px 20px',
                  borderBottom: idx < filteredAccounts.length - 1 ? '1px solid #f8fafc' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                  animationDelay: `${idx * 0.04}s`,
                  cursor: 'default',
                  background: isOverdue ? 'linear-gradient(to right, #fff7ed, #fff)' : 'transparent',
                  borderLeft: isOverdue ? '3px solid #f97316' : '3px solid transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = isOverdue ? '#fff7ed' : '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = isOverdue ? 'linear-gradient(to right, #fff7ed, #fff)' : 'transparent'}
              >
                {/* Account & Customer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      background: isOverdue ? 'linear-gradient(135deg,#fff7ed,#fef3c7)' : 'linear-gradient(135deg,#eef4ff,#dbeafe)',
                      color: isOverdue ? '#b45309' : '#2563eb',
                      borderRadius: '6px',
                      border: isOverdue ? '1px solid #fde68a' : '1px solid #bfdbfe',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Account #{a.id}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div
                      style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: isOverdue
                          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                          : 'linear-gradient(135deg, #3763f4, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      {(a.customer_name || customerMap[a.customer_id] || `#${a.customer_id}`).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.customer_name || customerMap[a.customer_id] || `Customer #${a.customer_id}`}
                      </div>
                      <div style={{ fontSize: '11px', color: isOverdue ? '#f97316' : '#94a3b8', fontWeight: isOverdue ? 700 : 400 }}>
                        {isOverdue
                          ? `⚠️ ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue — Fine: ₹${lateFine}`
                          : (a.customer_phone ? a.customer_phone : `EMI: ₹${a.monthly_installment}/mo`)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Provided */}
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {inr(a.amount_provided)}
                </div>

                {/* Total Payable */}
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {inr(a.total_payable)}
                </div>

                {/* Outstanding / Fine */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: outstanding > 0 ? '#ef4444' : '#22c55e',
                    }}
                  >
                    {inr(outstanding)}
                  </span>
                  {isOverdue && lateFine > 0 && (
                    <span style={{
                      fontSize: '11px', fontWeight: 700, color: '#dc2626',
                      background: '#fef2f2', padding: '2px 6px',
                      borderRadius: '4px', border: '1px solid #fca5a5',
                      display: 'inline-flex', alignItems: 'center', gap: '3px', width: 'fit-content',
                    }}>
                      ⚠️ +{inr(lateFine)} fine
                    </span>
                  )}
                  {isOverdue && (
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      Due now: <strong style={{ color: '#b91c1c' }}>{inr(totalDue)}</strong>
                    </span>
                  )}
                </div>

                {/* Health Badge */}
                <div>
                  <HealthBadge health={health} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
