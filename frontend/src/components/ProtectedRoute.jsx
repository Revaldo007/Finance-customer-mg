import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-slate-500">Loading…</div>
  }
  if (!admin) {
    return <Navigate to="/login" replace />
  }
  return children
}
