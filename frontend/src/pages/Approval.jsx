import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Search } from 'lucide-react'
import api from '../services/api'

export default function Approval() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(null)

  const load = async () => {
    const res = await api.get('/requests')
    setRequests((res.data.data || []).filter(r => r._status === 'pending'))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handle = async (sheetRow, action) => {
    setProcessing(sheetRow)
    try {
      await api.put(`/requests/${sheetRow}/${action}`)
      await load()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal')
    } finally {
      setProcessing(null)
    }
  }

  const filtered = requests.filter(r =>
    !search ||
    r['Item Type']?.toLowerCase().includes(search.toLowerCase()) ||
    r['Requestor Name']?.toLowerCase().includes(search.toLowerCase()) ||
    r['City']?.toLowerCase().includes(search.toLowerCase()) ||
    r['Mex Name']?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari request..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="text-sm text-gray-500">{filtered.length} request pending</div>
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Requestor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Merchant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kota</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tujuan</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                    <CheckCircle size={32} className="mx-auto mb-2 text-green-300" />
                    Tidak ada request pending — semua sudah diproses!
                  </td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{r['Date Request']}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r['Requestor Name']}</td>
                    <td className="px-4 py-3 text-gray-700">{r['Item Type']}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{r['Mex Name'] || '-'}</p>
                      {r['Mex ID'] && <p className="text-xs text-gray-400 font-mono">{r['Mex ID']}</p>}
                    </td>
                    <td className="px-4 py-3"><span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{r['City']}</span></td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">{r['Qty']}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate">{r['Purpose Request']}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handle(r._sheetRow, 'approve')}
                          disabled={processing === r._sheetRow}
                          className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          onClick={() => handle(r._sheetRow, 'reject')}
                          disabled={processing === r._sheetRow}
                          className="flex items-center gap-1 bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
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
