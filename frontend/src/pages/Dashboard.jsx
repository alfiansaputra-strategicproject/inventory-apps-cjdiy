import { useState, useEffect } from 'react'
import { ClipboardList, CheckSquare, Clock, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatsCard from '../components/StatsCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Dashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [r, s] = await Promise.all([api.get('/requests'), api.get('/stock')])
        setRequests(r.data.data || [])
        setStock(s.data.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const pending = requests.filter(r => r._status === 'pending')
  const approved = requests.filter(r => r._status === 'approved')
  const myRequests = requests.filter(r => r['Requestor Name'] === user?.name)

  const now = new Date()
  const thisMonth = `${now.toLocaleString('id-ID', { month: 'long' })} ${now.getFullYear()}`
  const distributed = requests.filter(r => r['Month Distribute'] === thisMonth || r['Date Distribute'])

  const cityData = requests.reduce((acc, r) => {
    const city = r['City'] || 'Lainnya'
    const existing = acc.find(a => a.city === city)
    if (existing) existing.total += 1
    else acc.push({ city, total: 1 })
    return acc
  }, []).sort((a, b) => b.total - a.total)

  const lowStock = stock.filter(s => {
    const qty = parseInt(s['Current Stock'] || 0)
    return qty === 0
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-medium text-gray-600">Selamat datang, <span className="text-gray-900 font-semibold">{user?.name}</span></h2>
        <p className="text-sm text-gray-400 mt-0.5">Inventory Collateral CJDIY — {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Request Pending" value={pending.length} subtitle="Menunggu approval" icon={Clock} color="amber" />
        <StatsCard title="Sudah Diapprove" value={approved.length} subtitle="Siap didistribusi" icon={CheckSquare} color="green" />
        <StatsCard title="Distribusi Bulan Ini" value={distributed.length} subtitle={thisMonth} icon={ClipboardList} color="indigo" />
        <StatsCard title="Item Stok Habis" value={lowStock.length} subtitle="Perlu restock segera" icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Request per Kota</h3>
          {cityData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-16">Belum ada data request</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cityData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" name="Jumlah Request" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Request Terbaru</h3>
          {requests.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-16">Belum ada request</p>
          ) : (
            <div className="space-y-2">
              {requests.slice(0, 6).map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r['Item Type']}</p>
                    <p className="text-xs text-gray-400">{r['Requestor Name']} · {r['City']} · {r['Date Request']}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r._status === 'approved' ? 'bg-green-100 text-green-700' :
                    r._status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {r._status === 'approved' ? 'Approve' : r._status === 'rejected' ? 'Reject' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Item dengan Stok Habis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((s, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-sm font-medium text-gray-800">{s['Nama Item / Asset'] || s['Nama Item/Asset']}</p>
                <p className="text-xs text-red-600 mt-1">{s['Cities']} · {s['Status Stock']} · Stok: 0</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
