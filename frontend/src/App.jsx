import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import DocsList from './pages/admin/DocsList'
import UploadPDF from './pages/admin/UploadPDF'
import AddDocument from './pages/admin/AddDocument'
import EditDocument from './pages/admin/EditDocument'
import AdminStats from './pages/admin/AdminStats'
import StudentLayout from './pages/student/StudentLayout'
import StudentChat from './pages/student/StudentChat'
import StudentEmail from './pages/student/StudentEmail'
import './assets/globals.css'

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return null
  return isAdmin ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/admin/login"   element={<AdminLogin />} />

        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index               element={<Navigate to="/admin/documents" replace />} />
          <Route path="documents"    element={<DocsList />} />
          <Route path="upload"       element={<UploadPDF />} />
          <Route path="add"          element={<AddDocument />} />
          <Route path="edit/:id"     element={<EditDocument />} />
          <Route path="stats"        element={<AdminStats />} />
        </Route>

        <Route path="/student" element={<StudentLayout />}>
          <Route index               element={<Navigate to="/student/chat" replace />} />
          <Route path="chat"         element={<StudentChat />} />
          <Route path="email"        element={<StudentEmail />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
