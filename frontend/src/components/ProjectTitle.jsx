// Reusable animated project title - "market terminal" style.
// No background box: a title that decodes in and then catches a cyan glint every
// few seconds, with a light that travels underneath.
// The scrolling ticker tape is a separate export - put <TickerTape /> wherever you want it
// (on the login page it runs below the card).
// Self-contained (no Tailwind / icon library).
//
//   <ProjectTitle />                    -> default title
//   <ProjectTitle title="Other text" /> -> override the text on one page
//   <TickerTape />                      -> the scrolling tape on its own
//
// Change PROJECT_TITLE once and every page that uses it updates.
// Hover the banner to replay the animation.

import { useLayoutEffect, useRef, useState } from 'react'

export const PROJECT_TITLE = 'Web-Based Finance and Customer Management System'

/* ---------- decode effect ---------- */
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789$%#&'
const DECODE_MS = 1500

const scramble = (text, revealed) =>
  text
    .split('')
    .map((ch, i) =>
      ch === ' ' || i < revealed ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
    )
    .join('')

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- ticker tape (arrows only, purely decorative) ---------- */
const TICKS = [
  ['Revenue', true], ['Invoices', true], ['Customers', true], ['Receivables', false],
  ['Payments', true], ['Expenses', false], ['Profit', true], ['Balance', true],
]

export default function ProjectTitle({ title = PROJECT_TITLE, className = '' }) {
  const [tick, setTick] = useState(0) // bump to replay
  const [decoding, setDecoding] = useState(false)
  const [out, setOut] = useState(title)
  const h2Ref = useRef(null)
  const sizerRef = useRef(null)
  const widths = useRef([])

  // Decode effect. Every scrambled character is locked to the width of the real
  // character it replaces, so the title (and the card below it) never changes size.
  useLayoutEffect(() => {
    const h2 = h2Ref.current
    const sizer = sizerRef.current
    setOut(title)
    setDecoding(false)
    if (!h2 || !sizer || prefersReducedMotion()) return undefined

    const cs = getComputedStyle(h2)
    const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3
    if (sizer.getBoundingClientRect().height > lineH * 1.5) return undefined // wrapped on a narrow screen: skip

    const ctx = document.createElement('canvas').getContext('2d')
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    const spacing = parseFloat(cs.letterSpacing) || 0
    widths.current = title.split('').map((ch) => ctx.measureText(ch).width + spacing)

    setOut(scramble(title, 0))
    setDecoding(true)

    let raf
    let last = 0
    const start = performance.now()
    const step = (now) => {
      const t = now - start
      if (t >= DECODE_MS) {
        setOut(title)
        setDecoding(false)
        return
      }
      if (now - last > 45) {
        last = now
        setOut(scramble(title, Math.floor((t / DECODE_MS) * title.length)))
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [title, tick])

  return (
    <div
      className={`pt-wrap ${className}`}
      role="banner"
      onMouseEnter={() => setTick((n) => n + 1)}
    >
      <div className="pt-banner">
        <h2 className="pt-text" aria-label={title} ref={h2Ref} key={`t${tick}`}>
          {/* invisible real title reserves the space, so the page never shifts while the text decodes */}
          <span className="pt-sizer" ref={sizerRef} aria-hidden="true">{title}</span>
          {decoding ? (
            <span className="pt-face pt-face-flex" aria-hidden="true">
              {out.split('').map((ch, i) => (
                <span key={i} className="pt-ch" style={{ width: widths.current[i] }}>{ch}</span>
              ))}
            </span>
          ) : (
            <span className="pt-face" aria-hidden="true">{title}</span>
          )}
        </h2>
      </div>

      <style>{`
        .pt-wrap {
          display: flex;
          justify-content: center;
          width: 100%;
          max-width: 850px;
          flex: none;
          margin: 0 auto;
          user-select: none;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        .pt-banner {
          position: relative;
          width: 100%;
          padding-bottom: 8px;
          animation: pt-enter .8s cubic-bezier(.22, 1, .36, 1) both;
        }
        /* light that keeps travelling along the bottom */
        .pt-banner::after {
          content: '';
          position: absolute;
          left: 8%; right: 8%; bottom: 0;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, transparent 0%, #6366f1 30%, #22d3ee 50%, #6366f1 70%, transparent 100%);
          background-size: 200% 100%;
          animation: pt-edge 4s linear infinite;
        }
        @keyframes pt-edge  { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes pt-enter {
          from { opacity: 0; transform: translateY(-10px) scale(.98); }
          to   { opacity: 1; transform: none; }
        }

        /* title */
        .pt-text {
          position: relative;
          z-index: 1;
          margin: 0;
          padding: 14px 24px 12px;
          text-align: center;
          font-size: clamp(17px, 2.9vw, 28px);
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.3;
          text-wrap: balance;
          font-variant-numeric: tabular-nums;
        }
        .pt-sizer { display: block; visibility: hidden; }
        /* while decoding: one fixed-width slot per character, single line */
        .pt-face.pt-face-flex { display: flex; flex-wrap: nowrap; justify-content: center; align-items: baseline; white-space: pre; }
        .pt-ch { flex: none; display: block; text-align: center; }
        .pt-face {
          position: absolute;
          inset: 0;
          display: block;
          padding: inherit;
          box-sizing: border-box;
          background-image: linear-gradient(
            100deg,
            #0f172a 0%, #0f172a 40%, #6366f1 48%, #22d3ee 52%, #0f172a 60%, #0f172a 100%
          );
          background-size: 300% 100%;
          background-position: 100% 0;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 10px rgba(99, 102, 241, .2));
          animation: pt-glint 5.5s ease-in-out 2.6s infinite;
        }
        @keyframes pt-glint {
          0%   { background-position: 100% 0; }
          35%  { background-position: 0% 0; }
          100% { background-position: 0% 0; }
        }

        /* short screens: tighter padding so everything fits in one screen */
        @media (max-height: 680px) {
          .pt-text { padding: 10px 24px 10px; }
        }
        @media (max-width: 520px) {
          .pt-text { padding: 10px 16px 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pt-banner, .pt-banner::after, .pt-face { animation: none; }
          .pt-face { background-position: 0% 0; }
        }
      `}</style>
    </div>
  )
}

/* ---------- ticker tape (arrows only, purely decorative) ---------- */
export function TickerTape({ className = '' }) {
  return (
    <div className={`tt-wrap ${className}`} aria-hidden="true">
      <div className="tt-tape">
        <div className="tt-track">
          {[...TICKS, ...TICKS].map(([label, up], i) => (
            <span key={i} className={`tt-tick ${up ? 'tt-up' : 'tt-down'}`}>
              {label} <b>{up ? '▲' : '▼'}</b>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .tt-wrap {
          width: 100%;
          max-width: 850px;
          flex: none;
          margin: 0 auto;
          user-select: none;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          animation: tt-enter .8s cubic-bezier(.22, 1, .36, 1) .2s both;
        }
        @keyframes tt-enter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
        .tt-tape {
          height: 28px;
          overflow: hidden;
          border-top: 1px solid rgba(15, 23, 42, .1);
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
                  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
        }
        .tt-track {
          display: flex;
          width: max-content;
          animation: tt-scroll 32s linear infinite;
        }
        .tt-tick {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          padding: 0 18px;
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          border-left: 1px solid rgba(15, 23, 42, .1);
          white-space: nowrap;
        }
        .tt-tick b { font-size: 10px; }
        .tt-tick.tt-up b   { color: #059669; }
        .tt-tick.tt-down b { color: #e11d48; }
        @keyframes tt-scroll { to { transform: translateX(-50%); } }

        /* short screens: drop the tape so the login still fits in one screen */
        @media (max-height: 680px) {
          .tt-wrap { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tt-wrap, .tt-track { animation: none; }
        }
      `}</style>
    </div>
  )
}