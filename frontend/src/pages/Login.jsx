import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { Boxes } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential })
      login(res.data.user, res.data.token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      alert(err.response?.data?.error || 'Login gagal. Pastikan email Anda terdaftar.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <Boxes size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Apps</h1>
          <p className="text-gray-500 text-sm mt-1">CJDIY — Manajemen Stok & Produk</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <p className="text-sm text-gray-600 text-center mb-4">
            Masuk menggunakan akun Google Anda
          </p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => alert('Login gagal. Coba lagi.')}
              size="large"
              shape="rectangular"
              text="signin_with"
              locale="id"
            />
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Hanya akun yang terdaftar yang dapat mengakses sistem ini.
        </p>
      </div>
    </div>
  )
}
