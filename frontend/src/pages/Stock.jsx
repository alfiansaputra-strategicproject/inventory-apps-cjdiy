import { useState, useEffect } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import api from '../services/api'

export default function Stock() {
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [cities, setCities] = useState([])
  const [editModal, setEditModal] = useState({ open: false, item: null })
  const [addModal, setAddModal] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [addForm, setAddForm] = useState({ cities: [], name: '', status_stock: 'Central Stock', current_stock: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await api.get('/stock')
    setStock(res.data.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    api.get('/stock/cities').then(r => setCities(r.data)).catch(() => {})
  }, [])

  const allCities = [...new Set(stock.map(s => s['Cities']).filter(Boolean))]
  const nameKey = 'Nama Item / Asset'

  const filtered = stock.filter(s => {
    const matchSearch = !search || (s[nameKey] || '').toLowerCase().includes(search.toLowerCase())
    const matchCity = !filterCity || s['Cities'] === filterCity
    return matchSearch && matchCity
  })

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/stock/${editModal.item._sheetRow}`, { current_stock: editValue })
      await load()
      setEditModal({ open: false, item: null })
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal update stok')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/stock/items', addForm)
      await load()
      setAddModal(false)
      setAddForm({ cities: [], name: '', status_stock: 'Central Stock', current_stock: '' })
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal tambah item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    const name = item['Nama Item / Asset'] || item['Nama Item/Asset']
    if (!confirm(`Hapus "${name}" (${item['Cities']}) dari stok?\n\nData di Google Sheets akan terhapus permanen.`)) return
    try {
      await api.delete(`/stock/${item._sheetRow}`)
      await load()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus')
    }
  }

  const getStockColor = (qty) => {
    const q = parseInt(qty || 0)
    if (q === 0) return 'bg-red-100 text-red-700'
    if (q <= 10) return 'bg-amber-100 text-amber-700'
    return 'bg-green-100 text-green-700'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama item..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Semua Kota</option>
            {allCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0">
          <Plus size={16} /> Tambah Item
        </button>
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kota</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Item / Collateral</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status Stok</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Current Stock</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Tidak ada data stok</td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3"><span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{s['Cities']}</span></td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s[nameKey] || s['Nama Item/Asset']}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s['Status Stock']}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-sm font-bold px-3 py-0.5 rounded-full ${getStockColor(s['Current Stock'])}`}>
                        {parseInt(s['Current Stock'] || 0).toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditValue(s['Current Stock'] || '0'); setEditModal({ open: true, item: s }) }} className="flex items-center gap-1 text-xs text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors">
                          <Pencil size={13} /> Edit
                        </button>
                        <button onClick={() => handleDelete(s)} className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors">
                          <Trash2 size={13} /> Hapus
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

      <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, item: null })} title="Update Current Stock" size="sm">
        {editModal.item && (
          <div className="mb-4 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
            <p className="font-medium text-gray-800">{editModal.item[nameKey]}</p>
            <p className="text-xs mt-0.5">{editModal.item['Cities']} · {editModal.item['Status Stock']}</p>
          </div>
        )}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
            <input required type="number" min="0" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModal({ open: false, item: null })} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Tambah Item Baru ke Stok" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item / Collateral <span className="text-red-500">*</span></label>
            <input required value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kota (bisa pilih lebih dari satu) <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {cities.map(c => (
                <label key={c} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors ${addForm.cities.includes(c) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={addForm.cities.includes(c)} onChange={() => setAddForm(f => ({ ...f, cities: f.cities.includes(c) ? f.cities.filter(x => x !== c) : [...f.cities, c] }))} className="hidden" />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Stok</label>
              <select value={addForm.status_stock} onChange={e => setAddForm(f => ({ ...f, status_stock: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>Central Stock</option>
                <option>Cities Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
              <input type="number" min="0" value={addForm.current_stock} onChange={e => setAddForm(f => ({ ...f, current_stock: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={saving || addForm.cities.length === 0} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Tambah Item'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
