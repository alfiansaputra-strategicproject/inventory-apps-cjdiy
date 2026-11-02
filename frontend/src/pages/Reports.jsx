import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../services/api'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

export default function Reports() {
  const [requests, setRequests] = useState([])
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/requests'), api.get('/stock')])
      .then(([r, s]) => { setRequests(r.data.data || []); setStock(s.data.data || []) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const byCity = requests.reduce((acc, r) => {
    const city = r['City'] || 'Lainnya'
    const e = acc.find(a => a.name === city)
    if (e) e.value += 1; else acc.push({ name: city, value: 1 })
    return acc
  }, [])

  const byItem = requests.reduce((acc, r) => {
    const item = r['Item Type'] || 'Lainnya'
    const e = acc.find(a => a.item === item)
    if (e) e.total += parseInt(r['Qty'] || 0); else acc.push({ item, total: parseInt(r['Qty'] || 0) })
    return acc
  }, []).sort((a, b) => b.total - a.total).slice(0, 10)

  const lowStock = stock.filter(s => parseInt(s['Current Stock'] || 0) < 10).slice(0, 10).map(s => ({
    name: `${s['Nama Item / Asset'] || s['Nama Item/Asset']} (${s['Cities']})`,
    stok: parseInt(s['Current Stock'] || 0)
  }))

  const statusSummary = [
    { name: 'Pending', value: requests.filter(r => r._status === 'pending').length },
    { name: 'Approve', value: requests.filter(r => r._status === 'approved').length },
    { name: 'Reject', value: requests.filter(r => r._status === 'rejected').length },
  ].filter(s => s.value > 0)

  const statusColors = ['#f59e0b', '#22c55e', '#ef4444']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Request per Kota</h3>
          {byCity.length === 0 ? <p className="text-gray-400 text-sm text-center py-16">Belum ada data</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byCity} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Jumlah Request" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Request</h3>
          {statusSummary.length === 0 ? <p className="text-gray-400 text-sm text-center py-16">Belum ada data</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusSummary} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusSummary.map((_, i) => <Cell key={i} fill={statusColors[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">10 Item Paling Banyak Direquest (Total Qty)</h3>
          {byItem.length === 0 ? <p className="text-gray-400 text-sm text-center py-16">Belum ada data</p> : (
            <div className="space-y-3">
              {byItem.map((p, i) => (
                <div key={p.item}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <span className="truncate max-w-[200px]">{p.item}</span>
                    </span>
                    <span className="text-gray-500 shrink-0">{p.total.toLocaleString('id-ID')} pcs</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(p.total / byItem[0].total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Stok Menipis (&lt; 10)</h3>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-16">Semua stok aman</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={lowStock} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={140} />
                <Tooltip />
                <Bar dataKey="stok" name="Stok" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
