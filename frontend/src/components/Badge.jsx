import { Code2, UserCheck, GraduationCap } from 'lucide-react'

/**
 * Credits badge - fixed to the bottom-right corner of the screen.
 * Usage: <Badge />  (or override any prop, e.g. <Badge guide="Mrs. Real Name" />)
 * Place at: src/components/Badge.jsx
 */
export default function Badge({
  developer = 'Benina',
  guide = 'XYZ',
  college = 'Muslim Arts College',
  place = 'Thiruvithancode',
}) {
  return (
    <aside className="dev-badge" tabIndex={0} aria-label="Project credits">
      {/* small screens: collapses to just this icon, expands on hover / focus */}
      <div className="dev-badge-icon"><GraduationCap size={17} /></div>

      <div className="dev-badge-body">
        <div className="dev-badge-row">
          <Code2 size={13} />
          <span>Developed by</span>
          <b>{developer}</b>
        </div>
        <div className="dev-badge-row dev-badge-row-stack">
          <UserCheck size={13} />
          <div className="dev-badge-stack">
            <span>Guided by</span>
            <b>{guide}</b>
          </div>
        </div>
        <div className="dev-badge-college">
          <b>{college}</b>
          <span>{place}</span>
        </div>
      </div>

      <style>{`
        .dev-badge {
          position: fixed;
          right: 16px;
          bottom: 14px;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px 9px 9px;
          background: rgba(255, 255, 255, .82);
          -webkit-backdrop-filter: blur(8px);
                  backdrop-filter: blur(8px);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 6px 20px rgba(15, 23, 42, .08);
          outline: none;
          animation: dev-badge-in .6s ease both .4s;
        }
        .dev-badge:focus-visible { box-shadow: 0 0 0 2px #4f46e5; }
        @keyframes dev-badge-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        .dev-badge-icon {
          flex: none;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;
          border-radius: 9px;
          color: #fff;
          background: linear-gradient(135deg, #1e1b4b, #4f46e5);
        }
        .dev-badge-body { display: flex; flex-direction: column; gap: 3px; line-height: 1.25; text-align: left; white-space: nowrap; }
        .dev-badge-row { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #64748b; }
        .dev-badge-row svg { color: #4f46e5; flex: none; }
        .dev-badge-row b { color: #0f172a; font-weight: 600; }
        .dev-badge-row-stack { align-items: flex-start; }
        .dev-badge-row-stack svg { margin-top: 2px; }
        .dev-badge-stack { display: flex; flex-direction: column; line-height: 1.25; }
        .dev-badge-college {
          display: flex;
          flex-direction: column;
          margin-top: 3px;
          padding-top: 4px;
          border-top: 1px dashed #cbd5e1;
          font-size: 11px;
          color: #64748b;
        }
        .dev-badge-college b { color: #0f172a; font-weight: 600; font-size: 11.5px; }

        /* narrower screens: stay out of the ticker's way - icon only, details on hover/focus */
        @media screen and (max-width: 1180px) {
          .dev-badge { gap: 0; padding: 5px; }
          .dev-badge-body {
            max-width: 0;
            opacity: 0;
            overflow: hidden;
            transition: max-width .35s ease, opacity .25s ease, margin .35s ease;
          }
          .dev-badge:hover .dev-badge-body,
          .dev-badge:focus .dev-badge-body { max-width: 230px; opacity: 1; margin: 0 6px 0 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dev-badge { animation: none; }
          .dev-badge-body { transition: none; }
        }
      `}</style>
    </aside>
  )
}