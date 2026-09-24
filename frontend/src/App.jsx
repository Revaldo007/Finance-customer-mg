import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Sidebar from './components/Sidebar.jsx'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Customers from './pages/Customers.jsx'
import CustomerProfile from './pages/CustomerProfile.jsx'
import FinanceAccounts from './pages/FinanceAccounts.jsx'
import Repayments from './pages/Repayments.jsx'
import Reports from './pages/Reports.jsx'

function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '28px 32px', maxWidth: '1400px', overflowX: 'hidden' }}>{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>
      } />
      <Route path="/customers/:id" element={
        <ProtectedRoute><Layout><CustomerProfile /></Layout></ProtectedRoute>
      } />
      <Route path="/finance-accounts" element={
        <ProtectedRoute><Layout><FinanceAccounts /></Layout></ProtectedRoute>
      } />
      <Route path="/repayments" element={
        <ProtectedRoute><Layout><Repayments /></Layout></ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>
      } />
    </Routes>
  )
}
