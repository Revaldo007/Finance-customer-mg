import { useEffect, useState } from 'react'

const STATUS_CONFIG = {
  on_track: {
    dot: '#22c55e',
    bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    border: '#86efac',
    text: '#15803d',
    shadow: 'rgba(34,197,94,0.25)',
    pulse: '#22c55e',
  },
  due_soon: {
    dot: '#f59e0b',
    bg: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)',
    border: '#fcd34d',
    text: '#92400e',
    shadow: 'rgba(245,158,11,0.25)',
    pulse: '#f59e0b',
  },
  partial: {
    dot: '#f97316',
    bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
    border: '#fdba74',
    text: '#c2410c',
    shadow: 'rgba(249,115,22,0.25)',
    pulse: '#f97316',
  },
  overdue: {
    dot: '#ef4444',
    bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    border: '#fca5a5',
    text: '#b91c1c',
    shadow: 'rgba(239,68,68,0.25)',
    pulse: '#ef4444',
  },
  completed: {
    dot: '#6366f1',
    bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    border: '#c4b5fd',
    text: '#4338ca',
    shadow: 'rgba(99,102,241,0.25)',
    pulse: '#6366f1',
  },
}

const LABEL_MAP = {
  on_track:  'On Track',
  due_soon:  'Due Soon',
  partial:   'Partial',
  overdue:   'Overdue',
  completed: 'Completed',
}

// Spinning arc loader
function SpinnerIcon() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12"
      style={{ animation: 'healthSpin 0.9s linear infinite', flexShrink: 0 }}
    >
      <circle cx="6" cy="6" r="4.5" fill="none" stroke="#cbd5e1" strokeWidth="1.8" />
      <path
        d="M6 1.5 A4.5 4.5 0 0 1 10.5 6"
        fill="none" stroke="#3763f4" strokeWidth="1.8" strokeLinecap="round"
      />
    </svg>
  )
}

// Skeleton shimmer while loading
function LoadingSkeleton() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)',
        border: '1px solid #e2e8f0',
        color: '#94a3b8',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer sweep */}
      <span style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
        animation: 'healthShimmer 1.4s ease-in-out infinite',
      }} />
      <SpinnerIcon />
      Checking…
    </span>
  )
}

export default function HealthBadge({ health }) {
  const [visible, setVisible] = useState(false)

  // Fade in when health data arrives
  useEffect(() => {
    if (health) {
      // Tiny delay so the CSS transition is visible
      const t = setTimeout(() => setVisible(true), 60)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [health])

  // Still loading — show animated skeleton
  if (!health) return <LoadingSkeleton />

  const code = health.code
  const cfg  = STATUS_CONFIG[code] || STATUS_CONFIG['on_track']
  const label = LABEL_MAP[code] || health.label

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.text,
        boxShadow: `0 2px 8px ${cfg.shadow}`,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        // Fade-in + slight scale-up transition
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.85)',
        transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Animated pulsing dot */}
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10, flexShrink: 0 }}>
        <span style={{
          position: 'absolute',
          width: '100%', height: '100%',
          borderRadius: '50%',
          background: cfg.pulse,
          opacity: 0.4,
          animation: 'healthPulse 2s ease-in-out infinite',
        }} />
        <span style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: cfg.dot,
          boxShadow: `0 0 4px ${cfg.pulse}`,
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }} />
      </span>
      {label}
    </span>
  )
}
