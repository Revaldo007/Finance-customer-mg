import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import HealthBadge from '../components/HealthBadge.jsx'

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#3763f4,#6366f1)',
  'linear-gradient(135deg,#22c55e,#16a34a)',
  'linear-gradient(135deg,#f97316,#ea580c)',
  'linear-gradient(135deg,#ec4899,#db2777)',
  'linear-gradient(135deg,#06b6d4,#0891b2)',
]

function Timeline({ events }) {
  return (
    <ol style={{ position: 'relative', paddingLeft: '20px', margin: 0, listStyle: 'none' }}>
      <div style={{ position: 'absolute', left: '6px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom,#3763f4,#e2e8f0)', borderRadius: '2px' }} />
      {events.map((e, i) => (
        <li key={i} style={{ marginBottom: '16px', position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '-17px', top: '2px',
            width: '12px', height: '12px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#3763f4,#6366f1)',
            border: '2px solid #fff',
            boxShadow: '0 0 0 2px #c7d7fd',
          }} />
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 2px', fontWeight: 500 }}>{e.date}</p>
          <p style={{ fontSize: '13px', color: '#1e293b', margin: 0, fontWeight: 500 }}>{e.label}</p>
        </li>
      ))}
    </ol>
  )
}

const SUMMARY_CARDS = [
  { key: 'num_accounts',          label: 'Total Accounts',   icon: '📂', fmt: v => v,    gradient: 'linear-gradient(135deg,#eef4ff,#dbeafe)', iconBg: '#3763f4', text: '#1e40af' },
  { key: 'total_amount_provided', label: 'Amount Provided',  icon: '💰', fmt: inr,       gradient: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', iconBg: '#6366f1', text: '#4338ca' },
  { key: 'total_amount_paid',     label: 'Amount Paid',      icon: '✅', fmt: inr,       gradient: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', iconBg: '#22c55e', text: '#15803d' },
  { key: 'total_outstanding',     label: 'Outstanding',      icon: '⚠️', fmt: inr,       gradient: 'linear-gradient(135deg,#ffedd5,#fed7aa)', iconBg: '#f97316', text: '#c2410c' },
]

export default function CustomerProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    client.get(`/customers/${id}/profile`).then((r) => setProfile(r.data))
  }, [id])

  if (!profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#94a3b8', fontSize: '14px' }}>
      Loading profile…
    </div>
  )

  const { customer, summary, finance_accounts } = profile
  const avatarGradient = AVATAR_GRADIENTS[(customer.id || 0) % AVATAR_GRADIENTS.length]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Link */}
      <Link to="/customers" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontSize: '13px', color: '#3763f4', textDecoration: 'none', fontWeight: 600,
        padding: '6px 12px', background: 'linear-gradient(135deg,#eef4ff,#dbeafe)',
        borderRadius: '8px', border: '1px solid #bfdbfe', width: 'fit-content',
      }}>
        ← Back to Customers
      </Link>

      {/* Customer Info Card */}
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '28px',
        boxShadow: '0 4px 24px rgba(15,23,42,0.08)', border: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'flex-start', gap: '20px',
      }}>
        {/* Avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: '20px', flexShrink: 0,
          background: avatarGradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '26px', fontWeight: 800,
          boxShadow: '0 8px 24px rgba(55,99,244,0.3)',
        }}>
          {customer.full_name?.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            {customer.full_name}
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px', fontWeight: 500 }}>Customer ID #{customer.id}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {[
              ['Phone', customer.phone],
              ['Email', customer.email || '—'],
              ['ID Proof Type', customer.id_proof_type || '—'],
              ['ID Proof Number', customer.id_proof_number || '—'],
              ['Employment', customer.employment_type || '—'],
              ['Monthly Income', customer.monthly_income ? inr(customer.monthly_income) : '—'],
              ['Address', customer.address || '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' }}>{label}</p>
                <p style={{ fontSize: '13px', color: '#1e293b', margin: 0, fontWeight: 500 }}>{val}</p>
              </div>
            ))}
          </div>

          {/* KYC Document Verification Attachment */}
          {customer.id_proof_document && (
            <div style={{
              marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(135deg,#f8fafc,#eff6ff)',
              borderRadius: '12px', padding: '12px 16px', border: '1px solid #dbeafe',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
                  color: '#b91c1c', border: '1px solid #fca5a5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 800, flexShrink: 0,
                }}>
                  {customer.id_proof_document_name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMG'}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                    {customer.id_proof_document_name || `${customer.id_proof_type || 'ID'}_Document`}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified KYC Document
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const win = window.open()
                  if (win) {
                    win.document.write(
                      `<iframe src="${customer.id_proof_document}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                    )
                  }
                }}
                style={{
                  background: '#fff', border: '1px solid #bfdbfe', borderRadius: '8px',
                  padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#3763f4',
                  cursor: 'pointer', boxShadow: '0 1px 3px rgba(55,99,244,0.1)',
                }}
              >
                View Document ↗
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {SUMMARY_CARDS.map(cfg => (
          <div key={cfg.key} style={{
            background: cfg.gradient, borderRadius: '14px', padding: '16px 18px',
            border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: cfg.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, boxShadow: `0 4px 10px ${cfg.iconBg}55` }}>
              {cfg.icon}
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: cfg.text, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{cfg.label}</p>
              <p style={{ fontSize: '20px', fontWeight: 800, color: cfg.text, margin: '1px 0 0', lineHeight: 1.1 }}>{cfg.fmt(summary?.[cfg.key] ?? 0)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Finance Accounts */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 14px' }}>Finance Accounts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {finance_accounts.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '14px', padding: '40px', textAlign: 'center', border: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '13px' }}>
              No finance accounts for this customer yet.
            </div>
          ) : finance_accounts.map((acc) => (
            <div key={acc.id} style={{
              background: '#fff', borderRadius: '16px', padding: '20px 24px',
              boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9',
              transition: 'box-shadow 0.18s',
            }}>
              {/* Account Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '12px',
                    background: 'linear-gradient(135deg,#3763f4,#6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '14px', fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(55,99,244,0.3)',
                  }}>#{acc.id}</div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Account #{acc.id}</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Started {acc.start_date || '—'}</p>
                  </div>
                  <HealthBadge health={acc.health} />
                </div>
                <button
                  onClick={() => setExpanded(expanded === acc.id ? null : acc.id)}
                  style={{
                    fontSize: '12px', fontWeight: 600, color: '#3763f4', cursor: 'pointer',
                    padding: '6px 14px', background: 'linear-gradient(135deg,#eef4ff,#dbeafe)',
                    borderRadius: '8px', border: '1px solid #bfdbfe',
                  }}
                >
                  {expanded === acc.id ? '↑ Hide Timeline' : '↓ View Timeline'}
                </button>
              </div>

              {/* Account Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Provided', val: inr(acc.amount_provided), color: '#1e293b' },
                  { label: 'Total Payable', val: inr(acc.total_payable), color: '#1e293b' },
                  { label: 'Amount Paid', val: inr(acc.amount_paid), color: '#16a34a' },
                  { label: 'Outstanding', val: inr(acc.outstanding_amount), color: acc.outstanding_amount > 0 ? '#f97316' : '#16a34a' },
                  { label: 'Status', val: acc.status, color: '#4338ca', capitalize: true },
                ].map(({ label, val, color, capitalize }) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>{label}</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color, margin: 0, textTransform: capitalize ? 'capitalize' : 'none' }}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              {expanded === acc.id && acc.timeline?.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>Payment Timeline</p>
                  <Timeline events={acc.timeline} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
