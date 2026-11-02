import { useState, useEffect } from 'react'
import { Search, ArrowUp, ArrowDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function MyRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    api.get('/requests')
      .then(res => {
        const all = res.data.data || []
        setRequests(user?.role === 'admin' ? all : all.filter(r => r['Requestor Name'] === user?.name))
      })
      .finally(() => setLoading(false))
  }, [user])

  const filtered = requests.filter(r => {
    const matchSearch = !search ||
      r['Item Type']?.toLowerCase().includes(search.toLowerCase()) ||
      r['Mex Name']?.toLowerCase().includes(search.toLowerCase()) ||
      r['City']?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || r._status === filterStatus
    return matchSearch && matchStatus
  })

  const statusBadge = (status) => {
    if (status === 'approved') return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Approve</span>
    if (status === 'rejected') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Reject</span>
    return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari item, merchant, kota..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approve</option>
          <option value="rejected">Reject</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Item / Collateral</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Merchant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kota</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tujuan</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Distribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">Tidak ada request ditemukan</td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{r['Date Request']}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r['Item Type']}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{r['Mex Name'] || '-'}</p>
                      {r['Mex ID'] && <p className="text-xs text-gray-400 font-mono">{r['Mex ID']}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r['City']}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">{r['Qty']}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{r['Purpose Request']}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(r._status)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r['Month Distribute'] ? (
                        <div>
                          <p className="font-medium">{r['Month Distribute']}</p>
                          {r['PIC Ops'] && <p className="text-gray-400">{r['PIC Ops']}</p>}
                        </div>
                      ) : r._status === 'approved' ? (
                        <span className="text-amber-600">Menunggu distribusi</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
