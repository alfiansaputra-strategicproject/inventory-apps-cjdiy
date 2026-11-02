const express = require('express')
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')

const router = express.Router()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

function getPicOpsEmails() {
  return (process.env.PIC_OPS_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    const { email, name, picture } = payload

    const adminEmails = getAdminEmails()
    const picOpsEmails = getPicOpsEmails()
    const emailLower = email.toLowerCase()
    const role = adminEmails.includes(emailLower) ? 'admin'
               : picOpsEmails.includes(emailLower) ? 'pic_ops'
               : 'staff'

    const user = { email, name, role, picture }
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.json({ token, user })
  } catch (err) {
    console.error('Auth error:', err)
    res.status(401).json({ error: 'Authentication failed' })
  }
})

router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
