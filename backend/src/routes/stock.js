const express = require('express')
const auth = require('../middleware/auth')
const { getSummaryData, updateSummaryCell, appendSummaryItem, deleteSummaryRow } = require('../services/googleSheets')

const router = express.Router()
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const { data, colMap } = await getSummaryData()
    res.json({ data, colMap })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/items', async (req, res) => {
  try {
    const { data } = await getSummaryData()
    const nameKey = 'Nama Item / Asset'
    const items = [...new Set(data.map(d => d[nameKey] || d['Nama Item/Asset']).filter(Boolean))].sort()
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/cities', async (req, res) => {
  const cities = (process.env.CITIES || 'Semarang,Yogyakarta,Solo').split(',').map(c => c.trim()).filter(Boolean)
  res.json(cities)
})

router.put('/:sheetRow', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Tidak diizinkan' })
    const { current_stock } = req.body
    const { colMap } = await getSummaryData()

    const currentStockKey = Object.keys(colMap).find(k => k.toLowerCase().includes('current stock'))
    if (!currentStockKey) return res.status(500).json({ error: 'Kolom Current Stock tidak ditemukan' })

    await updateSummaryCell(parseInt(req.params.sheetRow), colMap[currentStockKey], current_stock)
    res.json({ message: 'Stok berhasil diupdate' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/items', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Tidak diizinkan' })
    const { cities, name, status_stock, current_stock } = req.body
    if (!name) return res.status(400).json({ error: 'Nama item wajib diisi' })

    const citiesList = Array.isArray(cities) ? cities : [cities]
    for (const city of citiesList) {
      await appendSummaryItem([city || '', name, status_stock || 'Central Stock', '', '', current_stock || 0])
    }
    res.status(201).json({ message: 'Item berhasil ditambahkan' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:sheetRow', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Tidak diizinkan' })
    await deleteSummaryRow(parseInt(req.params.sheetRow))
    res.json({ message: 'Item stok berhasil dihapus' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
