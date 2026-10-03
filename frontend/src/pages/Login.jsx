import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { User, Landmark, Eye, EyeOff, ArrowLeft, ArrowRight, X, Zap, Check, ShieldCheck } from 'lucide-react'
import ProjectTitle, { TickerTape } from '../components/ProjectTitle.jsx'
import Badge from '../components/Badge.jsx'

// Demo account used by the Auto fill button
const DEMO = { username: 'admin', password: 'admin123' }

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)   // false = cover closed (hides the form), true = cover open
  const usernameRef = useRef(null)
  const submitRef = useRef(null)
  const [flash, setFlash] = useState(false)
  const isFilled = username === DEMO.username && password === DEMO.password

  // Login is a single, fixed screen: never show a page scrollbar
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prev = [html.style.overflow, body.style.overflow]
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prev[0]
      body.style.overflow = prev[1]
    }
  }, [])

  // Focus the username once the cover has finished opening
  useEffect(() => {
    if (!open) return undefined
    const t = setTimeout(() => usernameRef.current?.focus({ preventScroll: true }), 650)
    return () => clearTimeout(t)
  }, [open])

  // Esc closes the cover
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Auto fill: "types" the demo credentials into the fields, then focuses Login so Enter submits
  const [typing, setTyping] = useState(false)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const fillDemo = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setError('')
    setShowPassword(false)

    const finish = () => {
      setTyping(false)
      setFlash(true)
      timers.current.push(setTimeout(() => setFlash(false), 800))
      submitRef.current?.focus()
    }

    // respect reduced motion: fill instantly
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setUsername(DEMO.username)
      setPassword(DEMO.password)
      finish()
      return
    }

    setTyping(true)
    setUsername('')
    setPassword('')
    const STEP = 55
    let t = 0
    for (let i = 1; i <= DEMO.username.length; i++) {
      t += STEP
      timers.current.push(setTimeout(() => setUsername(DEMO.username.slice(0, i)), t))
    }
    t += 140
    for (let i = 1; i <= DEMO.password.length; i++) {
      t += STEP
      timers.current.push(setTimeout(() => setPassword(DEMO.password.slice(0, i)), t))
    }
    t += 120
    timers.current.push(setTimeout(finish, t))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="h-screen overflow-hidden flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-slate-100 to-indigo-100 px-4 py-4"
      style={{ height: '100dvh' }}
    >
      {/* Project title - sits above the card */}
      <ProjectTitle />

      <div className={`ftm-container${open ? ' is-open' : ''}`}>
        {/* Login form */}
        <div className="ftm-form-box">
          {/* phones: the cover slides fully away, so give a way back */}
          <button type="button" className="ftm-back" onClick={() => setOpen(false)}>
            <ArrowLeft size={16} /> Back
          </button>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Landmark size={22} className="text-slate-900" />
              <h1>Login</h1>
            </div>
            <p className="ftm-subtitle">Finance & Customer Management</p>

            {error && <div className="ftm-error">{error}</div>}

            <div className={`ftm-input-box${flash ? ' ftm-flash' : ''}`}>
              <input
                ref={usernameRef}
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <User size={18} className="ftm-icon" />
            </div>
            <div className={`ftm-input-box${flash ? ' ftm-flash' : ''}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="ftm-icon ftm-icon-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Demo access pass */}
            <div className={`ftm-demo${isFilled ? ' is-filled' : ''}${typing ? ' is-typing' : ''}`}>
              <div className="ftm-demo-icon">
                <ShieldCheck size={17} />
              </div>
              <div className="ftm-demo-info">
                <em><i className="ftm-dot" />{isFilled ? 'Access granted' : typing ? 'Typing…' : 'Demo access'}</em>
                <span>admin <s>/</s> admin123</span>
              </div>
              <button
                type="button"
                className={`ftm-autofill${isFilled ? ' is-filled' : ''}`}
                onClick={fillDemo}
                disabled={typing}
              >
                <span className="ftm-autofill-label">
                  {isFilled ? (<><Check size={13} /> Filled</>) : typing ? (<>Filling<b className="ftm-dots"><i /><i /><i /></b></>) : (<><Zap size={13} /> Auto fill</>)}
                </span>
              </button>
            </div>

            <button ref={submitRef} type="submit" className="ftm-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>
        </div>

        {/* Cover: closed = covers the whole card, open = slides to the right half */}
        <div className="ftm-cover">
          <div className="ftm-cover-inner">
            <div className="ftm-cover-icon">
              <Landmark size={30} strokeWidth={1.8} />
            </div>
            <h1>Hello, Welcome!</h1>
            <p>Finance &amp; Customer Management</p>
            <button
              type="button"
              className="ftm-cover-btn"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              {open ? (<><X size={16} /> Close</>) : (<>Login  <ArrowRight size={16} /></>)}
            </button>
          </div>
        </div>
      </div>

      {/* Ticker tape - runs below the card */}
      <TickerTape />

      {/* Credits badge - bottom-right corner */}
      <Badge />

      <style>{`
        .ftm-container {
          position: relative;
          width: 850px;
          max-width: 100%;
          flex: 0 1 550px;   /* up to 550px tall, shrinks to fit the screen */
          min-height: 0;
          background: #fff;
          margin: 0;
          border-radius: 30px;
          box-shadow: 0 10px 50px rgba(15, 23, 42, .15);
          overflow: hidden;
          display: flex;
        }
        .ftm-container h1 {
          font-size: 30px;
          margin: 6px 0;
          font-weight: 700;
        }
        .ftm-container p {
          font-size: 14px;
          margin: 8px 0;
          color: #64748b;
        }
        .ftm-container h1 { color: #0f172a; }
        .ftm-subtitle { margin-top: -4px; }
        .ftm-container form { width: 100%; }

        .ftm-form-box {
          position: relative;
          width: 50%;
          opacity: 0;
          visibility: hidden;
          transform: translateX(-20px);
          transition: opacity .35s ease, transform .5s ease, visibility 0s linear .5s;
          display: flex;
          align-items: center;
          color: #333;
          text-align: center;
          padding: 40px;
          box-sizing: border-box;
        }

        .ftm-container.is-open .ftm-form-box {
          opacity: 1;
          visibility: visible;
          transform: none;
          transition: opacity .5s ease .3s, transform .6s ease .3s, visibility 0s;
        }

        .ftm-back {
          display: none;
          position: absolute;
          top: 14px; left: 16px;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          padding: 4px 6px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
        }
        .ftm-back:hover { color: #0f172a; }

        /* demo access row + Auto fill (flat, matches inputs / buttons) */
        .ftm-demo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 8px 7px 10px;
          margin: 0 0 14px;
          text-align: left;
          background: transparent;
          border: 1.5px dashed #cbd5e1;
          border-radius: 10px;
          transition: border-color .2s, background .2s;
        }
        .ftm-demo:hover { border-color: #818cf8; background: #f8faff; }
        .ftm-demo.is-typing { border-style: solid; border-color: #4f46e5; background: #f5f7ff; }
        .ftm-demo.is-filled { border-style: solid; border-color: #a7f3d0; background: #f0fdf9; }

        .ftm-demo-icon {
          flex: none;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px; height: 30px;
          border-radius: 8px;
          color: #4f46e5;
          background: #eef2ff;
          transition: background .2s, color .2s;
        }
        .ftm-demo-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; line-height: 1.2; }
        .ftm-demo-info em {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-style: normal;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #94a3b8;
        }
        .ftm-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #4f46e5;
          animation: ftm-blink 1.6s ease-in-out infinite;
        }
        @keyframes ftm-blink { 50% { opacity: .3; } }
        .ftm-demo-info span {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ftm-demo-info span s { text-decoration: none; color: #94a3b8; margin: 0 1px; }

        .ftm-autofill {
          flex: none;
          display: inline-flex;
          align-items: center;
          padding: 7px 12px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #4f46e5;
          background: #eef2ff;
          cursor: pointer;
          transition: background .2s, color .2s, transform .15s;
        }
        .ftm-autofill-label { display: inline-flex; align-items: center; gap: 5px; }
        .ftm-autofill:hover:not(:disabled) { background: #0f172a; color: #fff; transform: translateY(-1px); }
        .ftm-autofill:active:not(:disabled) { transform: translateY(0); }
        .ftm-autofill:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; }
        .ftm-autofill:disabled { cursor: default; }

        /* typing dots */
        .ftm-dots { display: inline-flex; gap: 2px; margin-left: 1px; }
        .ftm-dots i { width: 3px; height: 3px; border-radius: 50%; background: currentColor; animation: ftm-bounce 1s infinite; }
        .ftm-dots i:nth-child(2) { animation-delay: .15s; }
        .ftm-dots i:nth-child(3) { animation-delay: .3s; }
        @keyframes ftm-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-3px); opacity: 1; } }

        /* filled state */
        .ftm-demo.is-filled .ftm-demo-icon { background: #d1fae5; color: #059669; }
        .ftm-demo.is-filled .ftm-dot { background: #10b981; animation: none; }
        .ftm-demo.is-filled .ftm-demo-info em { color: #059669; }
        .ftm-autofill.is-filled { background: #059669; color: #fff; }

        /* fields flash when auto-filled */
        .ftm-flash input { animation: ftm-flash .8s ease; }
        @keyframes ftm-flash {
          0%   { background: #e0e7ff; border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, .22); }
          100% { background: #f1f5f9; border-color: transparent; box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }

        .ftm-error {
          font-size: 13px;
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 8px 12px;
          border-radius: 8px;
          margin: 10px 0;
        }

        .ftm-input-box { position: relative; margin: 18px 0; }
        .ftm-input-box input {
          width: 100%;
          padding: 13px 46px 13px 16px;
          background: #f1f5f9;
          border-radius: 10px;
          border: 1px solid transparent;
          outline: none;
          font-size: 15px;
          color: #0f172a;
          font-weight: 500;
          box-sizing: border-box;
          transition: border-color .15s, background .15s;
        }
        .ftm-input-box input:focus { background: #fff; border-color: #4f46e5; }
        .ftm-input-box input::placeholder { color: #94a3b8; font-weight: 400; }
        .ftm-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .ftm-icon-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          pointer-events: auto;
          display: flex;
          align-items: center;
          transition: color .15s;
        }
        .ftm-icon-btn:hover { color: #475569; }

        .ftm-forgot-link { margin: -6px 0 14px; }
        .ftm-forgot-link p { font-size: 13px; }

        .ftm-btn {
          width: 100%;
          height: 46px;
          background: #0f172a;
          border-radius: 10px;
          box-shadow: 0 4px 14px rgba(15,23,42,.15);
          border: none;
          cursor: pointer;
          font-size: 15px;
          color: #fff;
          font-weight: 600;
          transition: background .15s;
        }
        .ftm-btn:hover { background: #1e293b; }
        .ftm-btn:focus-visible { outline: 2px solid #4f46e5; outline-offset: 3px; }
        .ftm-btn:disabled { opacity: .6; cursor: default; }

        .ftm-cover {
          position: absolute;
          inset: 0;
          z-index: 2;
          background-image:
            linear-gradient(135deg, rgba(15,23,42,.82), rgba(15,23,42,.7)),
            url('https://img.magnific.com/free-photo/accountant-calculating-profit-with-financial-analysis-graphs_74855-4937.jpg?ga=GA1.1.357786103.1784625829&semt=ais_hybrid&w=740&q=80');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          color: #fff;
          clip-path: inset(0 0 0 0);
          transition: clip-path .75s cubic-bezier(.77, 0, .18, 1);
        }
        .ftm-container.is-open .ftm-cover { clip-path: inset(0 0 0 50%); }

        .ftm-cover-inner {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 30px;
          box-sizing: border-box;
          text-align: center;
          transition: transform .75s cubic-bezier(.77, 0, .18, 1);
        }
        /* keeps the content centred on whatever part of the card the cover covers */
        .ftm-container.is-open .ftm-cover-inner { transform: translateX(25%); }

        .ftm-cover h1 { color: #fff; }
        .ftm-container .ftm-cover p { color: rgba(255,255,255,.8); margin: 0 0 8px; }
        .ftm-cover-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 66px; height: 66px;
          border-radius: 20px;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.3);
          -webkit-backdrop-filter: blur(8px);
                  backdrop-filter: blur(8px);
          box-shadow: 0 10px 25px rgba(0,0,0,.18);
        }
        .ftm-cover-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          padding: 11px 28px;
          border-radius: 999px;
          border: 1.5px solid rgba(255,255,255,.75);
          background: rgba(255,255,255,.12);
          color: #fff;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background .2s, color .2s, transform .15s;
        }
        .ftm-cover-btn:hover { background: #fff; color: #0f172a; transform: translateY(-1px); }
        .ftm-cover-btn:active { transform: translateY(0); }
        .ftm-cover-btn:focus-visible { outline: 2px solid #a5b4fc; outline-offset: 3px; }

        @media screen and (max-width: 650px) {
          .ftm-container { flex-direction: column; flex: 0 1 auto; }
          .ftm-form-box { width: 100%; padding-top: 48px; }
          .ftm-back { display: inline-flex; }
          /* phones: the cover slides fully out of the way instead of to a half */
          .ftm-container.is-open .ftm-cover { clip-path: inset(0 0 0 100%); }
          .ftm-container.is-open .ftm-cover-inner { transform: none; }
        }
        @media screen and (max-height: 660px) {
          .ftm-form-box { padding: 20px 32px; }
          .ftm-container h1 { font-size: 26px; }
          .ftm-input-box { margin: 12px 0; }
          .ftm-demo { padding: 7px 9px; margin-bottom: 10px; }
          .ftm-input-box input { padding: 11px 46px 11px 16px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftm-cover, .ftm-cover-inner, .ftm-form-box, .ftm-autofill { transition: none; }
          .ftm-dot, .ftm-dots i { animation: none; }
          .ftm-flash input { animation: none; }
        }
        @media screen and (max-width: 400px) {
          .ftm-form-box { padding: 20px; }
        }
      `}</style>
    </div>
  )
}