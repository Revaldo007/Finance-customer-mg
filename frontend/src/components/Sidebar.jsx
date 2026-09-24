import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Landmark,
  ReceiptText,
  FileBarChart2,
  LogOut,
  Building2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/',                  label: 'Dashboard',        Icon: LayoutDashboard },
  { to: '/customers',         label: 'Customers',        Icon: Users },
  { to: '/finance-accounts',  label: 'Finance Accounts', Icon: Landmark },
  { to: '/repayments',        label: 'Repayments',       Icon: ReceiptText },
  { to: '/reports',           label: 'Reports',          Icon: FileBarChart2 },
]

export default function Sidebar() {
  const { admin, logout } = useAuth()
  const initials = (admin?.full_name || admin?.username || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside style={{
      width: '230px',
      flexShrink: 0,
      background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      borderRight: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg,#3763f4,#6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(55,99,244,0.4)',
          }}>
            <Building2 size={19} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.2px' }}>FinanceHub</p>
            <p style={{ fontSize: '10px', color: '#64748b', margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {links.map((l) => {
          const IconComponent = l.Icon
          return (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                textDecoration: 'none',
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? 'linear-gradient(135deg,#3763f4,#2a4fd6)' : 'transparent',
                boxShadow: isActive ? '0 4px 12px rgba(55,99,244,0.35)' : 'none',
                transition: 'all 0.18s',
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = '#e2e8f0'
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.style.boxShadow.includes('55,99,244')) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#94a3b8'
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px' }}>
                <IconComponent size={18} strokeWidth={2} />
              </span>
              <span>{l.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '14px 14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#3763f4,#6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '12px', fontWeight: 700,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {admin?.full_name || admin?.username}
            </p>
            <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Administrator</p>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
            background: 'rgba(239,68,68,0.1)', color: '#f87171',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
