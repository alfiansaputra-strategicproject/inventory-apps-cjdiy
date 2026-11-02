const express = require('express')
const auth = require('../middleware/auth')
const { getSheetData, appendRow, updateRow, deleteRow } = require('../services/googleSheets')

const router = express.Router()
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const products = await getSheetData('Products')
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, sku, category, description, price, unit } = req.body
    if (!name || !sku) return res.status(400).json({ error: 'Name and SKU are required' })

    const existing = await getSheetData('Products')
    if (existing.find(p => p.sku === sku)) {
      return res.status(400).json({ error: 'SKU already exists' })
    }

    const id = `prod_${Date.now()}`
    const now = new Date().toISOString()
    await appendRow('Products', [id, name, sku, category || '', description || '', price || 0, unit || 'pcs', now])

    await appendRow('Stock', [`stk_${Date.now()}`, id, name, 0, 0, '', now])

    res.status(201).json({ id, name, sku, category, description, price, unit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const products = await getSheetData('Products')
    const idx = products.findIndex(p => p.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Product not found' })

    const { name, sku, category, description, price, unit } = req.body
    const updated = { ...products[idx], name, sku, category, description, price, unit }
    await updateRow('Products', idx, [updated.id, updated.name, updated.sku, updated.category, updated.description, updated.price, updated.unit, updated.created_at])

    const stocks = await getSheetData('Stock')
    const sIdx = stocks.findIndex(s => s.product_id === req.params.id)
    if (sIdx !== -1) {
      await updateRow('Stock', sIdx, [stocks[sIdx].id, stocks[sIdx].product_id, name, stocks[sIdx].quantity, stocks[sIdx].min_stock, stocks[sIdx].location, new Date().toISOString()])
    }

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const products = await getSheetData('Products')
    const idx = products.findIndex(p => p.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Product not found' })
    await deleteRow('Products', idx)
    res.json({ message: 'Product deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
