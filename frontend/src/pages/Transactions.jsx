import { useState, useEffect } from 'react'
import { Plus, ArrowUp, ArrowDown, Search } from 'lucide-react'
import Modal from '../components/Modal'
import api from '../services/api'

const EMPTY_FORM = { type: 'IN', product_id: '', quantity: '', notes: '' }

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const params = {}
      if (filterType) params.type = filterType
      const [t, p] = await Promise.all([api.get('/transactions', { params }), api.get('/products')])
      setTransactions(t.data)
      setProducts(p.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/transactions', { ...form, quantity: parseInt(form.quantity) })
      await load()
      setModal(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const filtered = transactions.filter(t =>
    t.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.notes?.toLowerCase().includes(search.toLowerCase()) ||
    t.user_email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari transaksi..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua Tipe</option>
            <option value="IN">Masuk</option>
            <option value="OUT">Keluar</option>
          </select>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(''); setModal(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus size={16} /> Tambah Transaksi
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Tipe</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Produk</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Jumlah</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Keterangan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Tidak ada transaksi</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {t.date ? new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${t.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.type === 'IN' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                        {t.type === 'IN' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{t.product_name}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">{parseInt(t.quantity || 0).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-gray-500">{t.notes || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{t.user_email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Tambah Transaksi" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <div className="flex gap-3">
              {['IN', 'OUT'].map(t => (
                <label key={t} className={`flex-1 flex items-center justify-center gap-2 border rounded-lg px-4 py-2 cursor-pointer text-sm font-medium transition-colors ${form.type === t ? (t === 'IN' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700') : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                  <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => setForm(f => ({ ...f, type: t }))} className="hidden" />
                  {t === 'IN' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
                  {t === 'IN' ? 'Stok Masuk' : 'Stok Keluar'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produk <span className="text-red-500">*</span></label>
            <select required value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Pilih produk...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah <span className="text-red-500">*</span></label>
            <input required type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opsional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
