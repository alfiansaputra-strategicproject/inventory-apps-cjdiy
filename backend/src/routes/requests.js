const express = require('express')
const auth = require('../middleware/auth')
const { getRequests, appendRequest, updateRequestCells } = require('../services/googleSheets')

const router = express.Router()
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const { data, colMap } = await getRequests()
    const approvalKey = Object.keys(colMap).find(k => k.toLowerCase().includes('approval')) || 'Approval'
    const result = data.map(r => ({
      ...r,
      _status: r[approvalKey] === 'Approve' ? 'approved'
              : r[approvalKey] === 'Reject' ? 'rejected'
              : 'pending',
    }))
    res.json({ data: result, colMap })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { mex_id, mex_name, city, item_type, qty, purpose } = req.body
    if (!city || !item_type || !qty) {
      return res.status(400).json({ error: 'city, item_type, dan qty wajib diisi' })
    }
    const now = new Date()
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    const values = [
      dateStr,
      req.user.name,
      mex_id || '',
      mex_name || '',
      city,
      item_type,
      qty,
      purpose || '',
    ]
    await appendRequest(values)
    res.status(201).json({ message: 'Request berhasil dibuat' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:sheetRow/approve', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Tidak diizinkan' })
    const { colMap } = await getRequests()
    const approvalKey = Object.keys(colMap).find(k => k.toLowerCase().includes('approval')) || 'Approval'
    const approvalCol = colMap[approvalKey]
    if (!approvalCol) return res.status(500).json({ error: 'Kolom Approval tidak ditemukan' })

    await updateRequestCells(parseInt(req.params.sheetRow), [
      { col: approvalCol, value: 'Approve' },
    ])
    res.json({ message: 'Request diapprove' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:sheetRow/reject', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Tidak diizinkan' })
    const { colMap } = await getRequests()
    const approvalKey = Object.keys(colMap).find(k => k.toLowerCase().includes('approval')) || 'Approval'
    const approvalCol = colMap[approvalKey]
    if (!approvalCol) return res.status(500).json({ error: 'Kolom Approval tidak ditemukan' })

    await updateRequestCells(parseInt(req.params.sheetRow), [
      { col: approvalCol, value: 'Reject' },
    ])
    res.json({ message: 'Request ditolak' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:sheetRow/distribute', async (req, res) => {
  try {
    if (!['admin', 'pic_ops'].includes(req.user.role)) return res.status(403).json({ error: 'Tidak diizinkan' })
    const { pic_ops, month_distribute, date_distribute, ambil_stock, ambil_stock_gudang, link_photo } = req.body
    const { colMap } = await getRequests()

    const updates = []
    const addUpdate = (keyContains, value) => {
      const key = Object.keys(colMap).find(k => k.toLowerCase().includes(keyContains.toLowerCase()))
      if (key && colMap[key] && value) updates.push({ col: colMap[key], value })
    }

    addUpdate('pic ops', pic_ops || req.user.name)
    addUpdate('month distribute', month_distribute || '')
    addUpdate('date distribute', date_distribute || '')
    addUpdate('ambil stock dari gudang', ambil_stock_gudang || '')
    addUpdate('link photo', link_photo || '')

    const ambilKey = Object.keys(colMap).find(k => {
      const lower = k.toLowerCase()
      return lower.includes('ambil stock') && !lower.includes('gudang')
    })
    if (ambilKey && colMap[ambilKey] && ambil_stock) {
      updates.push({ col: colMap[ambilKey], value: ambil_stock })
    }

    if (updates.length > 0) {
      await updateRequestCells(parseInt(req.params.sheetRow), updates)
    }
    res.json({ message: 'Distribusi dicatat' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
