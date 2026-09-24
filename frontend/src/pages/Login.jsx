import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { User, Landmark, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 px-4">
      <div className="ftm-container">
        {/* Login form */}
        <div className="ftm-form-box">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Landmark size={22} className="text-slate-900" />
              <h1>Sign In</h1>
            </div>
            <p className="ftm-subtitle">Finance & Customer Management</p>

            {error && <div className="ftm-error">{error}</div>}

            <div className="ftm-input-box">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <User size={18} className="ftm-icon" />
            </div>
            <div className="ftm-input-box">
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

            <div className="ftm-forgot-link">
              <p><b>Tips:</b> admin/admin123</p>
            </div>

            <button type="submit" className="ftm-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>
        </div>

        {/* Decorative panel */}
        <div className="ftm-panel">
          <h1>Hello, Welcome!</h1>
        </div>
      </div>

      <style>{`
        .ftm-container {
          position: relative;
          width: 850px;
          max-width: 100%;
          height: 550px;
          background: #fff;
          margin: 20px;
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
          width: 50%;
          display: flex;
          align-items: center;
          color: #333;
          text-align: center;
          padding: 40px;
          box-sizing: border-box;
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
        .ftm-btn:disabled { opacity: .6; cursor: default; }

        .ftm-panel {
          width: 50%;
          background-image:
            linear-gradient(135deg, rgba(15,23,42,.82), rgba(15,23,42,.7)),
            url('https://img.magnific.com/free-photo/accountant-calculating-profit-with-financial-analysis-graphs_74855-4937.jpg?ga=GA1.1.357786103.1784625829&semt=ais_hybrid&w=740&q=80');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 30px;
          box-sizing: border-box;
          text-align: center;
        }
        .ftm-panel h1 { color: #fff; }

        @media screen and (max-width: 650px) {
          .ftm-container { flex-direction: column; height: auto; }
          .ftm-form-box, .ftm-panel { width: 100%; }
          .ftm-panel { height: 160px; }
        }
        @media screen and (max-width: 400px) {
          .ftm-form-box { padding: 20px; }
        }
      `}</style>
    </div>
  )
}