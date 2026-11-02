import { useState, useEffect } from 'react'
import { CheckCircle, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const EMPTY = { mex_id: '', mex_name: '', city: '', item_type: '', qty: '', purpose: '', custom_city: '' }

export default function NewRequest() {
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [cities, setCities] = useState([])
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/stock/cities'), api.get('/stock/items')])
      .then(([c, i]) => { setCities(c.data); setItems(i.data) })
      .catch(console.error)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const city = form.city === '__custom__' ? form.custom_city : form.city
      await api.post('/requests', { ...form, city })
      setSuccess(true)
      setForm(EMPTY)
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <PlusCircle size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">Form Request Collateral</h2>
            <p className="text-xs text-gray-400">Isi form di bawah untuk request item collateral</p>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-green-700 text-sm">
            <CheckCircle size={16} /> Request berhasil dikirim! Tim akan segera memproses request Anda.
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
            <span className="text-gray-500">Requestor: </span>
            <span className="font-medium text-gray-800">{user?.name}</span>
            <span className="text-gray-400 ml-2">({user?.email})</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mex ID</label>
              <input value={form.mex_id} onChange={e => set('mex_id', e.target.value)} placeholder="cth: 6-ABCDEF123" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Merchant</label>
              <input value={form.mex_name} onChange={e => set('mex_name', e.target.value)} placeholder="Nama merchant / outlet" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kota <span className="text-red-500">*</span></label>
            <select required value={form.city} onChange={e => set('city', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Pilih kota...</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__custom__">+ Kota lainnya</option>
            </select>
            {form.city === '__custom__' && (
              <input required value={form.custom_city} onChange={e => set('custom_city', e.target.value)} placeholder="Tulis nama kota" className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item / Collateral <span className="text-red-500">*</span></label>
              <select required value={form.item_type} onChange={e => set('item_type', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Pilih item...</option>
                {items.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah <span className="text-red-500">*</span></label>
              <input required type="number" min="1" value={form.qty} onChange={e => set('qty', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan / Purpose Request <span className="text-red-500">*</span></label>
            <input required value={form.purpose} onChange={e => set('purpose', e.target.value)} placeholder="cth: Support Merchant, Pitching Kios, Branding FOG Area..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? 'Mengirim request...' : 'Kirim Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
