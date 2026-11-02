const express = require('express')
const auth = require('../middleware/auth')
const { getSheetData, appendRow } = require('../services/googleSheets')

const router = express.Router()
router.use(auth)

router.get('/', async (req, res) => {
  try {
    let transactions = await getSheetData('Transactions')
    const { type, startDate, endDate, product_id } = req.query

    if (type) transactions = transactions.filter(t => t.type === type)
    if (product_id) transactions = transactions.filter(t => t.product_id === product_id)
    if (startDate) transactions = transactions.filter(t => t.date >= startDate)
    if (endDate) transactions = transactions.filter(t => t.date <= endDate)

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
    res.json(transactions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { type, product_id, quantity, notes } = req.body
    if (!type || !product_id || !quantity) {
      return res.status(400).json({ error: 'type, product_id, and quantity are required' })
    }

    const products = await getSheetData('Products')
    const product = products.find(p => p.id === product_id)
    if (!product) return res.status(404).json({ error: 'Product not found' })

    const stocks = await getSheetData('Stock')
    const stockIdx = stocks.findIndex(s => s.product_id === product_id)

    if (stockIdx === -1) return res.status(404).json({ error: 'Stock record not found' })

    const currentQty = parseInt(stocks[stockIdx].quantity || 0)
    const qty = parseInt(quantity)
    const newQty = type === 'IN' ? currentQty + qty : currentQty - qty

    if (newQty < 0) return res.status(400).json({ error: 'Insufficient stock' })

    const now = new Date().toISOString()
    const { updateRow } = require('../services/googleSheets')
    const s = stocks[stockIdx]
    await updateRow('Stock', stockIdx, [s.id, s.product_id, s.product_name, newQty, s.min_stock, s.location, now])

    const id = `trx_${Date.now()}`
    await appendRow('Transactions', [id, now, type, product_id, product.name, qty, notes || '', req.user.email])

    res.status(201).json({ id, date: now, type, product_id, product_name: product.name, quantity: qty, notes })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
