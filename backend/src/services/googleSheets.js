const { google } = require('googleapis')

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID

function colIndexToLetter(index) {
  let letter = ''
  let i = index
  while (i >= 0) {
    letter = String.fromCharCode(65 + (i % 26)) + letter
    i = Math.floor(i / 26) - 1
  }
  return letter
}

async function getRawData(sheetName, range) {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: range || `${sheetName}!A:ZZ`,
  })
  return res.data.values || []
}

// Request Tracker: row 1 = headers, row 2+ = data
async function getRequests() {
  const rows = await getRawData('Request Tracker')
  if (rows.length < 2) return { data: [], headers: [], colMap: {} }

  const headers = rows[0]
  const colMap = {}
  headers.forEach((h, i) => { if (h) colMap[h.trim()] = colIndexToLetter(i) })

  const data = rows.slice(1).map((row, idx) => {
    const obj = { _rowIndex: idx, _sheetRow: idx + 2 }
    headers.forEach((h, i) => { if (h) obj[h.trim()] = row[i] !== undefined ? row[i] : '' })
    return obj
  }).filter(r => r['Date Request'] || r['Requestor Name'])

  return { data, headers, colMap }
}

async function appendRequest(values) {
  const sheets = getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Request Tracker!A1',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [values] },
  })
}

async function updateRequestCell(sheetRow, colLetter, value) {
  const sheets = getSheets()
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Request Tracker!${colLetter}${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[value]] },
  })
}

async function updateRequestCells(sheetRow, updates) {
  for (const { col, value } of updates) {
    await updateRequestCell(sheetRow, col, value)
  }
}

// SUMMARY: find header row dynamically, read full sheet width
async function getSummaryData() {
  const rows = await getRawData('SUMMARY', 'SUMMARY!A:Z')
  const headerRowIndex = rows.findIndex(row =>
    row.some(cell => cell && cell.toString().trim() === 'Cities')
  )
  if (headerRowIndex === -1) return { data: [], colMap: {} }

  const headers = rows[headerRowIndex]
  const colMap = {}
  headers.forEach((h, i) => {
    if (h) colMap[h.trim()] = colIndexToLetter(i)
  })

  const data = rows.slice(headerRowIndex + 1)
    .map((row, idx) => {
      const obj = { _rowIndex: headerRowIndex + 1 + idx, _sheetRow: headerRowIndex + 2 + idx }
      headers.forEach((h, i) => { if (h) obj[h.trim()] = row[i] !== undefined ? row[i] : '' })
      return obj
    })
    .filter(item => item['Cities'] && (item['Nama Item / Asset'] || item['Nama Item/Asset']))

  return { data, colMap }
}

async function updateSummaryCell(sheetRow, colLetter, value) {
  const sheets = getSheets()
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `SUMMARY!${colLetter}${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[value]] },
  })
}

async function appendSummaryItem(values) {
  const sheets = getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'SUMMARY!D:Z',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [values] },
  })
}

async function deleteSummaryRow(sheetRow) {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheet = res.data.sheets.find(s => s.properties.title === 'SUMMARY')
  if (!sheet) throw new Error('Sheet SUMMARY tidak ditemukan')
  const sheetId = sheet.properties.sheetId

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: sheetRow - 1,
            endIndex: sheetRow,
          },
        },
      }],
    },
  })
}

module.exports = {
  getRawData,
  getRequests,
  appendRequest,
  updateRequestCell,
  updateRequestCells,
  getSummaryData,
  updateSummaryCell,
  appendSummaryItem,
  deleteSummaryRow,
}
