import { useState, useEffect } from 'react'
import { Truck, Search } from 'lucide-react'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const EMPTY_DIST = { pic_ops: '', month_distribute: '', date_distribute: '', ambil_stock: 'Central Stock', ambil_stock_gudang: '', link_photo: '' }

export default function Distribution() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, item: null })
  const [form, setForm] = useState(EMPTY_DIST)
  const [saving, setSaving] = useState(false)
  const [cities, setCities] = useState([])

  const load = async () => {
    const res = await api.get('/requests')
    const approved = (res.data.data || []).filter(r => r._status === 'approved' && !r['Month Distribute'])
    setRequests(approved)
    setLoading(false)
  }

  useEffect(() => {
    load()
    api.get('/stock/cities').then(r => setCities(r.data)).catch(() => {})
  }, [])

  const openModal = (item) => {
    setForm({ ...EMPTY_DIST, pic_ops: user?.name || '' })
    setModal({ open: true, item })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/requests/${modal.item._sheetRow}/distribute`, form)
      await load()
      setModal({ open: false, item: null })
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal')
    } finally {
      setSaving(false)
    }
  }

  const filtered = requests.filter(r =>
    !search ||
    r['Item Type']?.toLowerCase().includes(search.toLowerCase()) ||
    r['Requestor Name']?.toLowerCase().includes(search.toLowerCase()) ||
    r['City']?.toLowerCase().includes(search.toLowerCase())
  )

  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    return d.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari request approved..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="text-sm text-gray-500">{filtered.length} siap distribusi</div>
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
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                    <Truck size={32} className="mx-auto mb-2 text-gray-300" />
                    Tidak ada request yang perlu didistribusi
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
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openModal(r)} className="flex items-center gap-1 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors mx-auto">
                        <Truck size={13} /> Catat Distribusi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, item: null })} title="Catat Distribusi" size="md">
        {modal.item && (
          <div className="mb-4 bg-indigo-50 rounded-lg px-4 py-3 text-sm">
            <p className="font-medium text-indigo-800">{modal.item['Item Type']} — {modal.item['Qty']} pcs</p>
            <p className="text-indigo-600 mt-0.5">{modal.item['Mex Name']} · {modal.item['City']} · Req: {modal.item['Requestor Name']}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bulan Distribusi <span className="text-red-500">*</span></label>
              <select required value={form.month_distribute} onChange={e => setForm(f => ({ ...f, month_distribute: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Pilih bulan...</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Distribusi</label>
              <input type="date" value={form.date_distribute} onChange={e => setForm(f => ({ ...f, date_distribute: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ambil Stok dari</label>
              <select value={form.ambil_stock} onChange={e => setForm(f => ({ ...f, ambil_stock: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>Central Stock</option>
                <option>Cities Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gudang Kota</label>
              <select value={form.ambil_stock_gudang} onChange={e => setForm(f => ({ ...f, ambil_stock_gudang: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIC Ops</label>
            <input value={form.pic_ops} onChange={e => setForm(f => ({ ...f, pic_ops: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link Foto Serah Terima</label>
            <input type="url" value={form.link_photo} onChange={e => setForm(f => ({ ...f, link_photo: e.target.value }))} placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false, item: null })} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan Distribusi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
