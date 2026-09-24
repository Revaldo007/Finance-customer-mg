import { useEffect, useState, useMemo } from 'react'
import client from '../api/client'

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const LATE_FINE_PER_DAY = 50

const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtDay = (d) => {
  if (!d) return { day: '—', mon: '' }
  const dt = new Date(d + 'T00:00:00')
  return {
    day: dt.toLocaleDateString('en-IN', { day: '2-digit' }),
    mon: dt.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
  }
}

const FIELD = {
  width: '100%', boxSizing: 'border-box',
  border: '1.5px solid #e2e8f0', borderRadius: '10px',
  padding: '8px 12px', fontSize: '13px', color: '#1e293b',
  outline: 'none', background: '#f8fafc', fontFamily: 'inherit',
}

const LABEL = {
  display: 'block', fontSize: '10px', fontWeight: 700,
  color: '#64748b', marginBottom: '5px',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

export default function Repayments() {
  const [repayments, setRepayments] = useState([])
  const [accounts, setAccounts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [isCustomDate, setIsCustomDate] = useState(false)
  const [form, setForm] = useState({
    finance_account_id: '',
    amount_paid: '',
    payment_date: new Date().toISOString().slice(0, 10),
    note: '',
  })

  const load = () => client.get('/repayments').then(r => setRepayments(r.data))
  const loadAccounts = () => client.get('/finance-accounts').then(r => {
    setAccounts(r.data)
    if (!selectedId && r.data.length > 0) {
      handleSelect(r.data[0])
    }
  })

  useEffect(() => { load(); loadAccounts() }, [])

  /* ── Sort accounts: overdue first, then name ── */
  const sortedAccounts = useMemo(() => [...accounts].sort((a, b) => {
    if (a.is_overdue && !b.is_overdue) return -1
    if (!a.is_overdue && b.is_overdue) return 1
    return (a.customer_name || '').localeCompare(b.customer_name || '')
  }), [accounts])

  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return sortedAccounts
    const q = search.toLowerCase()
    return sortedAccounts.filter(a =>
      (a.customer_name && a.customer_name.toLowerCase().includes(q)) ||
      String(a.id).includes(q)
    )
  }, [sortedAccounts, search])

  const selectedAcc = accounts.find(a => a.id === selectedId) || null

  /* ── Repayments for the selected account, newest first ── */
  const accRepayments = useMemo(() => (
    repayments
      .filter(r => r.finance_account_id === selectedId)
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
  ), [repayments, selectedId])

  const totalPaid = accRepayments.reduce((s, r) => s + r.amount_paid, 0)

  const days = selectedAcc?.days_overdue ?? 0
  const fine = selectedAcc?.late_fine_amount ?? 0
  const emiDue = selectedAcc?.monthly_installment ?? 0
  const totalDue = selectedAcc?.total_due_now ?? 0

  const isCompleted = Boolean(
    selectedAcc && (
      selectedAcc.status === 'completed' ||
      Number(selectedAcc.outstanding_amount || 0) <= 0 ||
      accRepayments.length >= (selectedAcc.duration_months || 0)
    )
  )

  const isOverdue = !isCompleted && (selectedAcc?.is_overdue ?? false)

  /* ── Select account from left panel ── */
  const handleSelect = (acc) => {
    setSelectedId(acc.id)
    setShowForm(false)
    setIsCustomDate(false)
    const d = acc.days_overdue ?? 0
    const f = acc.late_fine_amount ?? 0
    const t = acc.total_due_now ?? acc.monthly_installment ?? 0
    const fixedDate = acc.next_due_date || new Date().toISOString().slice(0, 10)
    setForm({
      finance_account_id: String(acc.id),
      amount_paid: String(t),
      payment_date: fixedDate,
      note: d > 0 ? `Includes late fine ₹${f} (${d} day${d > 1 ? 's' : ''} delay)` : '',
    })
  }

  /* ── Submit repayment ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    await client.post('/repayments', {
      finance_account_id: Number(form.finance_account_id),
      amount_paid: Number(form.amount_paid),
      payment_date: form.payment_date,
      note: form.note,
    })
    setShowForm(false)
    load()
    loadAccounts()
  }

  const overdueCnt = accounts.filter(a => a.is_overdue && a.status !== 'completed').length

  return (
    /* Break out of App.jsx padding to fill full viewport */
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      margin: '-28px -32px',
      background: '#f8fafc',
    }}>

      {/* ══════════════════════════════════════════════
          LEFT PANEL — Customer / Account List
      ══════════════════════════════════════════════ */}
      <div style={{
        width: '290px',
        minWidth: '290px',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        overflow: 'hidden',
        borderRight: '1px solid #e8edf5',
        boxShadow: '4px 0 16px rgba(15,23,42,0.06)',
      }}>

        {/* Panel Header */}
        <div style={{ padding: '24px 16px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                💵 Repayments
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                {accounts.length} active accounts
              </p>
            </div>
            {overdueCnt > 0 && (
              <div style={{
                fontSize: '10px', fontWeight: 800, padding: '4px 9px', borderRadius: '20px',
                background: '#fee2e2', color: '#dc2626',
                border: '1px solid #fca5a5',
                animation: 'pulse 2s infinite',
              }}>
                {overdueCnt} OVERDUE
              </div>
            )}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name or account #..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                ...FIELD,
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                color: '#1e293b',
                padding: '8px 10px 8px 32px',
                fontSize: '12px',
                borderRadius: '9px',
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px', pointerEvents: 'none' }}>🔍</span>
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '11px',
              }}>✕</button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f1f5f9', flexShrink: 0 }} />

        {/* Account List — Scrollable */}
        <div className="light-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 20px' }}>
          {filteredAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8', fontSize: '12px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>🔍</div>
              No accounts found
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isSel = selectedId === acc.id
              const od = acc.is_overdue && acc.status !== 'completed'
              const d = acc.days_overdue ?? 0
              const f = acc.late_fine_amount ?? 0

              return (
                <div
                  key={acc.id}
                  onClick={() => handleSelect(acc)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '11px',
                    padding: '11px 12px', borderRadius: '12px', marginBottom: '4px',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    background: isSel
                      ? 'linear-gradient(135deg, #3763f4 0%, #4f6ef7 100%)'
                      : od
                        ? '#fff5f5'
                        : 'transparent',
                    border: isSel
                      ? '1.5px solid #3763f4'
                      : od
                        ? '1.5px solid #fca5a5'
                        : '1.5px solid transparent',
                    boxShadow: isSel ? '0 4px 20px rgba(55,99,244,0.20)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isSel) e.currentTarget.style.background = od ? '#fee2e2' : '#f8fafc'
                  }}
                  onMouseLeave={e => {
                    if (!isSel) e.currentTarget.style.background = od ? '#fff5f5' : 'transparent'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: isSel
                      ? 'rgba(255,255,255,0.22)'
                      : od
                        ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                        : 'linear-gradient(135deg,#3763f4,#6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '14px', fontWeight: 800,
                    boxShadow: isSel ? '0 0 0 2px rgba(255,255,255,0.3)' : od ? '0 2px 8px rgba(239,68,68,0.4)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                    {(acc.customer_name || `#${acc.customer_id}`).charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <span style={{
                        fontSize: '13px', fontWeight: 700,
                        color: isSel ? '#fff' : od ? '#dc2626' : '#0f172a',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {acc.customer_name || `Customer #${acc.customer_id}`}
                      </span>
                      <span style={{
                        fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', flexShrink: 0,
                        background: isSel ? 'rgba(255,255,255,0.22)' : '#f1f5f9',
                        color: isSel ? '#fff' : '#64748b',
                      }}>
                        #{acc.id}
                      </span>
                    </div>
                    <div style={{ marginTop: '3px' }}>
                      {od ? (
                        <span style={{ fontSize: '11px', color: isSel ? '#fecaca' : '#ef4444', fontWeight: 600 }}>
                          ⚠️ {d}d late · Fine: ₹{f}
                        </span>
                      ) : (acc.status === 'completed' || Number(acc.outstanding_amount || 0) <= 0) ? (
                        <span style={{ fontSize: '11px', color: isSel ? '#bbf7d0' : '#16a34a', fontWeight: 600 }}>
                          ✓ Fully paid
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: isSel ? 'rgba(255,255,255,0.75)' : '#64748b' }}>
                          EMI ₹{acc.monthly_installment?.toLocaleString('en-IN')} · {acc.next_due_date ? fmtDate(acc.next_due_date) : 'No due date'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right arrow indicator */}
                  {isSel && (
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', flexShrink: 0, fontWeight: 700 }}>›</span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Bottom Policy Note */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#334155', lineHeight: 1.5 }}>
            📋 ₹50/day late fine after due date
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — Payment Details
      ══════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#f4f6fb',
        minWidth: 0,
      }}>

        {/* ── Empty State ── */}
        {!selectedAcc ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '16px',
          }}>
            <div style={{
              width: 88, height: 88, borderRadius: '24px',
              background: 'linear-gradient(135deg,#eef4ff,#dbeafe)',
              border: '2px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px',
              boxShadow: '0 8px 32px rgba(55,99,244,0.12)',
            }}>💳</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Select a customer</p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                Click any name on the left to view their payment history
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── TOP HEADER BAR ── */}
            <div style={{
              padding: '20px 28px 18px',
              background: '#fff',
              borderBottom: '1px solid #e8edf5',
              boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
              flexShrink: 0,
            }}>
              {/* Name + Button Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Large Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '14px', flexShrink: 0,
                    background: isOverdue
                      ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                      : 'linear-gradient(135deg,#3763f4,#6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '18px', fontWeight: 900,
                    boxShadow: isOverdue
                      ? '0 6px 20px rgba(239,68,68,0.35)'
                      : '0 6px 20px rgba(55,99,244,0.35)',
                  }}>
                    {(selectedAcc.customer_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>
                        {selectedAcc.customer_name}
                      </h2>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px',
                        background: '#eef4ff', color: '#3763f4', border: '1px solid #bfdbfe',
                      }}>
                        Account #{selectedAcc.id}
                      </span>
                      {isOverdue && (
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px',
                          background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
                          animation: 'pulse 2s infinite',
                        }}>
                          ⚠️ {days} day{days > 1 ? 's' : ''} overdue
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px',
                          background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac',
                        }}>✓ Loan Fully Paid</span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      {selectedAcc.duration_months} month loan · Started {fmtDate(selectedAcc.start_date)} · {selectedAcc.interest_rate}% p.a.
                    </p>
                  </div>
                </div>

                {isCompleted ? (
                  <span style={{
                    fontSize: '12px', fontWeight: 700, padding: '9px 18px', borderRadius: '11px',
                    background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                    color: '#15803d', border: '1.5px solid #86efac',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}>
                    ✓ Fully Paid &amp; Closed
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      if (!showForm && selectedAcc) {
                        setIsCustomDate(false)
                        const fixedDate = selectedAcc.next_due_date || new Date().toISOString().slice(0, 10)
                        const d = selectedAcc.days_overdue ?? 0
                        const f = selectedAcc.late_fine_amount ?? 0
                        const t = selectedAcc.total_due_now ?? selectedAcc.monthly_installment ?? 0
                        setForm({
                          finance_account_id: String(selectedAcc.id),
                          amount_paid: String(t),
                          payment_date: fixedDate,
                          note: d > 0 ? `Includes late fine ₹${f} (${d} day${d > 1 ? 's' : ''} delay)` : `Month #${accRepayments.length + 1} installment`,
                        })
                      }
                      setShowForm(s => !s)
                    }}
                    style={{
                      background: showForm
                        ? '#f1f5f9'
                        : isOverdue
                          ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                          : 'linear-gradient(135deg,#22c55e,#16a34a)',
                      color: showForm ? '#64748b' : '#fff',
                      border: 'none', borderRadius: '11px',
                      padding: '10px 22px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      boxShadow: showForm ? 'none' : isOverdue ? '0 4px 16px rgba(239,68,68,0.35)' : '0 4px 16px rgba(34,197,94,0.35)',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {showForm ? '✕ Cancel' : isOverdue ? '⚠️ Pay Now' : '+ Record Payment'}
                  </button>
                )}
              </div>

              {/* Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {[
                  { icon: '📅', label: 'Monthly EMI', val: inr(emiDue), c: '#3763f4', bg: '#eef4ff', br: '#bfdbfe' },
                  { icon: '✅', label: 'Total Paid', val: inr(totalPaid), c: '#16a34a', bg: '#f0fdf4', br: '#bbf7d0' },
                  { icon: '💰', label: 'Outstanding', val: inr(Math.max(0, selectedAcc.outstanding_amount)), c: isCompleted ? '#16a34a' : '#dc2626', bg: isCompleted ? '#f0fdf4' : '#fef2f2', br: isCompleted ? '#bbf7d0' : '#fca5a5' },
                  ...(isOverdue
                    ? [{ icon: '⚠️', label: `Fine (${days}d × ₹50)`, val: inr(fine), c: '#b45309', bg: '#fff7ed', br: '#fde68a' }]
                    : [{ icon: '🗓', label: 'Next Due Date', val: isCompleted ? 'All Paid' : (selectedAcc.next_due_date ? fmtDate(selectedAcc.next_due_date) : '—'), c: isCompleted ? '#16a34a' : '#475569', bg: isCompleted ? '#f0fdf4' : '#f8fafc', br: isCompleted ? '#bbf7d0' : '#e2e8f0' }]
                  ),
                  { icon: '🧾', label: isOverdue ? 'Total Due Now' : 'Payments Made', val: isOverdue ? inr(totalDue) : `${accRepayments.length} txn${accRepayments.length !== 1 ? 's' : ''}`, c: isOverdue ? '#b91c1c' : '#0f172a', bg: isOverdue ? '#fef2f2' : '#f8fafc', br: isOverdue ? '#fca5a5' : '#e2e8f0' },
                ].map(({ icon, label, val, c, bg, br }) => (
                  <div key={label} style={{
                    background: bg, border: `1.5px solid ${br}`, borderRadius: '12px',
                    padding: '11px 14px',
                    boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
                  }}>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {icon} {label}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 800, color: c, letterSpacing: '-0.3px' }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Banner */}
            {isCompleted && (
              <div style={{
                margin: '18px 28px 0',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1.5px solid #86efac',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🎉</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#166534' }}>
                      Loan Fully Paid &amp; Completed!
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#15803d' }}>
                      All {selectedAcc.duration_months} monthly installments ({inr(totalPaid)}) have been settled. No further payments are required.
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', background: '#fff', padding: '5px 12px', borderRadius: '8px', border: '1px solid #86efac' }}>
                  Status: Closed
                </span>
              </div>
            )}

            {/* ── RECORD PAYMENT FORM ── */}
            {!isCompleted && showForm && (
              <div style={{
                padding: '20px 28px',
                background: 'linear-gradient(135deg,#fff,#fafbff)',
                borderBottom: '1px solid #e8edf5',
                boxShadow: '0 2px 16px rgba(15,23,42,0.06)',
                flexShrink: 0,
                animation: 'fadeInUp 0.2s ease',
              }}>
                {/* Overdue Fine Alert */}
                {isOverdue && (
                  <div style={{
                    background: 'linear-gradient(135deg,#fff1f2,#fee2e2)',
                    border: '1.5px solid #fca5a5',
                    borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
                  }}>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#b91c1c' }}>
                      ⚠️ Payment is {days} day{days > 1 ? 's' : ''} overdue — Late fine applies
                    </p>
                    {[
                      ['📅 Monthly Installment (EMI)', inr(emiDue), '#1e293b'],
                      [`⏰ Late Fine (${days}d × ₹${LATE_FINE_PER_DAY}/day)`, inr(fine), '#ef4444'],
                    ].map(([lbl, val, col]) => (
                      <div key={lbl} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 0', borderBottom: '1px solid rgba(239,68,68,0.12)',
                      }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{lbl}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: col }}>{val}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#b91c1c' }}>💰 Total Due Now</span>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#b91c1c' }}>{inr(totalDue)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button type="button" onClick={() => setForm(f => ({ ...f, amount_paid: String(emiDue) }))}
                        style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                        EMI only ({inr(emiDue)})
                      </button>
                      <button type="button" onClick={() => setForm(f => ({ ...f, amount_paid: String(totalDue) }))}
                        style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '7px', border: '1.5px solid #ef4444', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>
                        EMI + Fine ({inr(totalDue)})
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      Record Month #{accRepayments.length + 1} of {selectedAcc.duration_months} Payment
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                      Fixed Due: {fmtDate(form.payment_date)}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    {/* Amount */}
                    <div>
                      <label style={LABEL}>
                        Amount (₹)
                        {isOverdue && <span style={{ marginLeft: 6, color: '#ef4444' }}>incl. fine</span>}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px', fontWeight: 700 }}>₹</span>
                        <input
                          type="number" step="0.01" required
                          value={form.amount_paid}
                          onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))}
                          style={{
                            ...FIELD, paddingLeft: '26px',
                            border: isOverdue ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                            background: isOverdue ? '#fff5f5' : '#f8fafc',
                            fontWeight: 700, fontSize: '14px',
                          }}
                        />
                      </div>
                    </div>
                    {/* Date */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <label style={{ ...LABEL, marginBottom: 0 }}>Payment Date</label>
                        <button
                          type="button"
                          onClick={() => {
                            if (isCustomDate) {
                              setForm(f => ({ ...f, payment_date: selectedAcc?.next_due_date || new Date().toISOString().slice(0, 10) }))
                            }
                            setIsCustomDate(c => !c)
                          }}
                          style={{
                            background: isCustomDate ? '#eff6ff' : '#f1f5f9',
                            border: '1px solid',
                            borderColor: isCustomDate ? '#93c5fd' : '#e2e8f0',
                            borderRadius: '5px',
                            padding: '1px 6px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: isCustomDate ? '#1d4ed8' : '#64748b',
                            cursor: 'pointer',
                          }}
                        >
                          {isCustomDate ? '🔒 Reset to Fixed' : '🔒 Fixed (Edit)'}
                        </button>
                      </div>
                      <input
                        type="date"
                        readOnly={!isCustomDate}
                        value={form.payment_date}
                        onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                        style={{
                          ...FIELD,
                          background: !isCustomDate ? '#f1f5f9' : '#fff',
                          border: !isCustomDate ? '1.5px solid #cbd5e1' : '1.5px solid #3763f4',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#0f172a',
                          cursor: !isCustomDate ? 'default' : 'text',
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        {!isCustomDate
                          ? `📅 Fixed monthly due date (${fmtDate(form.payment_date)})`
                          : '⚠️ Custom payment date mode'}
                      </span>
                    </div>
                    {/* Note */}
                    <div>
                      <label style={LABEL}>Note (optional)</label>
                      <input placeholder="Any remarks…" style={FIELD} value={form.note}
                        onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setShowForm(false)}
                      style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit" style={{
                      background: isOverdue ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#22c55e,#16a34a)',
                      color: '#fff', border: 'none', borderRadius: '10px',
                      padding: '9px 24px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      boxShadow: isOverdue ? '0 4px 14px rgba(239,68,68,0.35)' : '0 4px 14px rgba(34,197,94,0.35)',
                    }}>
                      {isOverdue ? '⚠️ Record Payment + Fine' : '✓ Save Payment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── PAYMENT HISTORY TIMELINE ── */}
            <div className="light-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 32px' }}>
              {/* Section Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Payment History
                </h3>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                  background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
                }}>
                  {accRepayments.length} records
                </span>
              </div>

              {accRepayments.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '56px 32px',
                  background: '#fff', borderRadius: '16px',
                  border: '1.5px dashed #e2e8f0',
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.5 }}>📭</div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#64748b' }}>No payments yet</p>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Click "+ Record Payment" to log the first payment
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {accRepayments.map((r, idx) => {
                    const { day, mon } = fmtDay(r.payment_date)
                    const hasLateFine = r.note && (r.note.toLowerCase().includes('late fine') || r.note.toLowerCase().includes('fine'))
                    const isFirst = idx === 0

                    return (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '14px',
                          padding: '14px 18px',
                          background: hasLateFine
                            ? 'linear-gradient(135deg, #fff7ed, #fffbf5)'
                            : '#fff',
                          borderRadius: '14px',
                          border: hasLateFine
                            ? '1.5px solid #fde68a'
                            : '1.5px solid #f1f5f9',
                          boxShadow: isFirst
                            ? '0 4px 16px rgba(15,23,42,0.08)'
                            : '0 1px 4px rgba(15,23,42,0.04)',
                          transition: 'box-shadow 0.15s',
                          animation: `fadeInUp 0.2s ease ${idx * 0.04}s both`,
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(15,23,42,0.10)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = isFirst ? '0 4px 16px rgba(15,23,42,0.08)' : '0 1px 4px rgba(15,23,42,0.04)'}
                      >
                        {/* Date Badge */}
                        <div style={{
                          width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                          background: hasLateFine
                            ? 'linear-gradient(135deg,#fef3c7,#fde68a)'
                            : 'linear-gradient(135deg,#dcfce7,#bbf7d0)',
                          border: hasLateFine ? '1px solid #f59e0b' : '1px solid #86efac',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: '1px',
                        }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: hasLateFine ? '#92400e' : '#15803d', lineHeight: 1 }}>{day}</span>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: hasLateFine ? '#b45309' : '#16a34a', lineHeight: 1 }}>{mon}</span>
                        </div>

                        {/* Date Text */}
                        <div style={{ width: '110px', flexShrink: 0 }}>
                          <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>{fmtDate(r.payment_date)}</span>
                          {isFirst && <div style={{ fontSize: '10px', color: '#22c55e', fontWeight: 700, marginTop: '2px' }}>Latest</div>}
                        </div>

                        {/* Amount */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '17px', fontWeight: 900, color: '#15803d', letterSpacing: '-0.5px' }}>
                              {inr(r.amount_paid)}
                            </span>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
                              background: '#dcfce7', color: '#15803d',
                            }}>↑ PAID</span>
                            {hasLateFine && (
                              <span style={{
                                fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
                                background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a',
                              }}>⚠️ incl. fine</span>
                            )}
                          </div>
                        </div>

                        {/* Note */}
                        {r.note ? (
                          <div style={{
                            maxWidth: '220px', minWidth: '120px',
                            fontSize: '12px', color: hasLateFine ? '#92400e' : '#64748b',
                            background: hasLateFine ? '#fef3c7' : '#f8fafc',
                            padding: '6px 10px', borderRadius: '8px',
                            border: hasLateFine ? '1px solid #fde68a' : '1px solid #e2e8f0',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {hasLateFine ? '⚠️ ' : '💬 '}{r.note}
                          </div>
                        ) : (
                          <span style={{ color: '#d1d5db', fontSize: '12px', minWidth: '60px', textAlign: 'right' }}>—</span>
                        )}
                      </div>
                    )
                  })}

                  {/* Loan Disbursement marker at bottom */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 18px',
                    background: 'linear-gradient(135deg,#eef4ff,#eff6ff)',
                    borderRadius: '14px', border: '1.5px dashed #bfdbfe',
                    opacity: 0.7,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)',
                      border: '1px solid #93c5fd',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px',
                    }}>🏦</div>
                    <div style={{ width: '110px' }}>
                      <span style={{ fontSize: '12px', color: '#3763f4', fontWeight: 600 }}>{fmtDate(selectedAcc.start_date)}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8' }}>Loan Disbursed</span>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {inr(selectedAcc.amount_provided)} at {selectedAcc.interest_rate}% p.a. for {selectedAcc.duration_months} months
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
