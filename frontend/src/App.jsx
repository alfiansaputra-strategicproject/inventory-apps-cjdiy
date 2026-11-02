import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewRequest from './pages/NewRequest'
import MyRequests from './pages/MyRequests'
import Approval from './pages/Approval'
import Distribution from './pages/Distribution'
import Stock from './pages/Stock'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="new-request" element={<NewRequest />} />
            <Route path="my-requests" element={<MyRequests />} />
            <Route path="approval" element={<AdminRoute><Approval /></AdminRoute>} />
            <Route path="distribution" element={<AdminRoute roles={['admin', 'pic_ops']}><Distribution /></AdminRoute>} />
            <Route path="stock" element={<AdminRoute><Stock /></AdminRoute>} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
