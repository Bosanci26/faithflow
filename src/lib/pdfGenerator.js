import { jsPDF } from 'jspdf'
import { CULTE, CURRENCY_SYMBOLS, stripDiacritics } from './constants'
import { generateStampilaSVG, stampilaSVGtoDataURL } from './stampila'

// --- Number to Romanian words ---
function numarInLitere(n) {
  const nr = Math.floor(n)
  if (nr === 0) return 'zero'
  const unitati = ['', 'unu', 'doi', 'trei', 'patru', 'cinci', 'sase', 'sapte', 'opt', 'noua',
    'zece', 'unsprezece', 'doisprezece', 'treisprezece', 'paisprezece', 'cincisprezece',
    'saisprezece', 'saptesprezece', 'optsprezece', 'nouasprezece']
  const zeci = ['', '', 'douazeci', 'treizeci', 'patruzeci', 'cincizeci', 'saizeci', 'saptezeci', 'optzeci', 'nouazeci']
  if (nr < 20) return unitati[nr]
  if (nr < 100) {
    const d = Math.floor(nr / 10), u = nr % 10
    return zeci[d] + (u > 0 ? ' si ' + unitati[u] : '')
  }
  if (nr < 1000) {
    const s = Math.floor(nr / 100), rest = nr % 100
    const sute = s === 1 ? 'o suta' : s === 2 ? 'doua sute' : unitati[s] + ' sute'
    return rest > 0 ? sute + ' si ' + numarInLitere(rest) : sute
  }
  if (nr < 1000000) {
    const m = Math.floor(nr / 1000), rest = nr % 1000
    const mii = m === 1 ? 'o mie' : m === 2 ? 'doua mii' : numarInLitere(m) + ' mii'
    return rest > 0 ? mii + ' si ' + numarInLitere(rest) : mii
  }
  return String(nr)
}

function sumaInLitere(suma, moneda) {
  const intPart = Math.floor(suma)
  const decPart = Math.round((suma - intPart) * 100)
  const sym = moneda === 'RON' ? 'lei' : moneda
  let text = numarInLitere(intPart) + ' ' + sym
  if (decPart > 0) text += ' si ' + numarInLitere(decPart) + ' bani'
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// --- Stamp: rectangular, 3 rows ---
function addStampilaRect(doc, church, x, y, w = 65, h = 28) {
  if (church.stamp_url) {
    try { doc.addImage(church.stamp_url, 'PNG', x, y, w, h); return } catch {}
  }
  const svg = generateStampilaSVG(church)
  const dataUrl = stampilaSVGtoDataURL(svg)
  try { doc.addImage(dataUrl, 'SVG', x, y, w, h); return } catch {}

  // Fallback: draw manually
  const cult = stripDiacritics(CULTE[church.denomination] || church.denomination || '')
  const name = stripDiacritics(church.name || '')
  const location = stripDiacritics(`${church.city || ''} - jud. ${church.county || ''}`)
  const cx = x + w / 2

  doc.setDrawColor(184, 134, 11)
  doc.setLineWidth(1.2)
  doc.rect(x, y, w, h)
  doc.setLineWidth(0.4)
  doc.rect(x + 2, y + 2, w - 4, h - 4)

  doc.setTextColor(120, 85, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.text(cult, cx, y + 9, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(name, cx, y + 17, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(location, cx, y + 24, { align: 'center' })

  doc.setTextColor(0)
}

// --- Header: thick lines + church info + cross ---
function newHeader(doc, church) {
  const cult = stripDiacritics(CULTE[church.denomination] || church.denomination || '')
  const name = stripDiacritics(church.name || '')
  const location = stripDiacritics(`${church.city || ''}, jud. ${church.county || ''}`)

  doc.setDrawColor(20, 20, 20)
  doc.setLineWidth(1.5)
  doc.line(15, 12, 195, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(cult, 105, 20, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(20, 20, 20)
  doc.text(name, 105, 29, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(location, 105, 37, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(184, 134, 11)
  doc.text('+', 105, 44, { align: 'center' })

  doc.setDrawColor(20, 20, 20)
  doc.setLineWidth(1.5)
  doc.line(15, 48, 195, 48)
}

// --- Title + gold line, returns next y ---
function addTitle(doc, title, y = 57) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(20, 20, 20)
  doc.text(title, 105, y, { align: 'center' })

  doc.setDrawColor(212, 168, 67)
  doc.setLineWidth(0.4)
  doc.line(55, y + 5, 155, y + 5)

  return y + 14
}

// --- Amount box with sum in words ---
function addAmountBox(doc, suma, moneda, y) {
  const sym = CURRENCY_SYMBOLS[moneda] || moneda
  const amountText = `${suma} ${sym}`
  const litere = sumaInLitere(suma, moneda)

  doc.setDrawColor(40, 40, 40)
  doc.setLineWidth(0.8)
  doc.rect(55, y, 100, 16)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(20, 20, 20)
  doc.text(amountText, 105, y + 11, { align: 'center' })

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text('(' + stripDiacritics(litere) + ')', 105, y + 23, { align: 'center' })

  return y + 29
}

// --- Signature columns ---
function addSignatures(doc, signatories, y) {
  if (!signatories.length) return y
  const count = signatories.length
  const colW = 180 / count
  const startX = 15

  signatories.forEach((sig, i) => {
    const cx = startX + colW * i + colW / 2
    const lx1 = startX + colW * i + 4
    const lx2 = startX + colW * (i + 1) - 4

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    doc.text(sig.label + ',', cx, y, { align: 'center' })

    if (sig.name) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      doc.text(stripDiacritics(sig.name), cx, y + 7, { align: 'center' })
    }

    doc.setDrawColor(40, 40, 40)
    doc.setLineWidth(0.4)
    doc.line(lx1, y + 16, lx2, y + 16)
  })

  return y + 22
}

// --- Footer ---
function newFooter(doc, church) {
  const pageH = doc.internal.pageSize.height
  const name = stripDiacritics(church.name || '')
  const city = stripDiacritics(church.city || '')
  const county = stripDiacritics(church.county || '')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Document generat electronic - ${name} - ${city} - ${county}`,
    105, pageH - 8, { align: 'center' }
  )
}

// ============================================================
// CHITANTA
// ============================================================
export function generateChitanta(church, data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.height

  newHeader(doc, church)

  let y = addTitle(doc, 'CHITANTA', 57)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Nr. ${stripDiacritics(String(data.nr || ''))} / ${data.data || ''}`, 105, y, { align: 'center' })
  y += 14

  const sym = CURRENCY_SYMBOLS[data.moneda] || data.moneda
  const casier = stripDiacritics(data.casier || church.casier_name || '')
  const donator = stripDiacritics(data.donator || data.persoana || '........')
  const scop = stripDiacritics(data.scop || data.detalii || data.categorie || '........')

  const bodyText = stripDiacritics(
    `Am primit de la ${donator} suma de ${data.suma} ${sym}, ` +
    `reprezentand ${scop}.`
  )
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  const bodyLines = doc.splitTextToSize(bodyText, 170)
  doc.text(bodyLines, 20, y)
  y += bodyLines.length * 7 + 12

  y = addAmountBox(doc, data.suma, data.moneda, y)
  y += 12

  y = addSignatures(doc, [{ label: 'Casier', name: casier }], y)

  addStampilaRect(doc, church, 128, pageH - 55, 62, 28)
  newFooter(doc, church)
  return doc
}

// ============================================================
// PROCES VERBAL COLECTA
// ============================================================
export function generateProcesVerbal(church, data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.height

  newHeader(doc, church)

  let y = addTitle(doc, 'PROCES VERBAL COLECTA', 57)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Nr. ${stripDiacritics(String(data.nr || ''))} / ${data.data || ''}`, 105, y, { align: 'center' })
  y += 14

  const sym = CURRENCY_SYMBOLS[data.moneda] || data.moneda
  const casier = stripDiacritics(data.casier || church.casier_name || '')
  const pastor = stripDiacritics(data.pastor || church.pastor_name || '')
  const tipServiciu = stripDiacritics(data.tipServiciu || data.detalii || 'serviciul de inchinare')
  const martor1 = stripDiacritics(data.martor1 || '')
  const martor2 = stripDiacritics(data.martor2 || '')
  const obs = data.observatii ? stripDiacritics(data.observatii) : ''

  const bodyText = stripDiacritics(
    `Subsemnatii, in calitate de reprezentanti ai ${church.name || 'bisericii'}, ` +
    `adeverim ca in data de ${data.data || '........'} la ${tipServiciu}, ` +
    `s-a colectat suma de ${data.suma} ${sym}.` +
    (obs ? ` Observatii: ${obs}.` : '')
  )
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  const bodyLines = doc.splitTextToSize(bodyText, 170)
  doc.text(bodyLines, 20, y)
  y += bodyLines.length * 7 + 12

  y = addAmountBox(doc, data.suma, data.moneda, y)
  y += 12

  const sigs = [
    { label: 'Casier', name: casier },
    { label: 'Pastor', name: pastor }
  ]
  if (martor1) sigs.push({ label: 'Martor 1', name: martor1 })
  if (martor2) sigs.push({ label: 'Martor 2', name: martor2 })
  y = addSignatures(doc, sigs, y)

  addStampilaRect(doc, church, 128, pageH - 55, 62, 28)
  newFooter(doc, church)
  return doc
}

// ============================================================
// ADEVERINTA DONATIE
// ============================================================
export function generateDonatie(church, data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.height

  newHeader(doc, church)

  let y = addTitle(doc, 'ADEVERINTA DONATIE', 57)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Nr. ${stripDiacritics(String(data.nr || ''))} / ${data.data || ''}`, 105, y, { align: 'center' })
  y += 14

  const sym = CURRENCY_SYMBOLS[data.moneda] || data.moneda
  const casier = stripDiacritics(data.casier || church.casier_name || '')
  const pastor = stripDiacritics(data.pastor || church.pastor_name || '')
  const beneficiar = stripDiacritics(data.beneficiar || data.persoana || '........')
  const tipDonatie = stripDiacritics(data.tipDonatie || 'donatie financiara')
  const adresa = data.adresa ? stripDiacritics(data.adresa) : ''

  let bodyText = `Prin prezenta se adevereste ca ${beneficiar}`
  if (data.serieCI && data.nrCI) {
    bodyText += `, posesor al C.I. seria ${data.serieCI} nr. ${data.nrCI}`
  }
  if (adresa) bodyText += `, cu domiciliul in ${adresa}`
  bodyText += `, a beneficiat de o ${tipDonatie} in valoare de ${data.suma} ${sym}, `
  bodyText += `acordata de catre ${church.name || 'biserica'}, in data de ${data.data || '........'}.`
  bodyText = stripDiacritics(bodyText)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  const bodyLines = doc.splitTextToSize(bodyText, 170)
  doc.text(bodyLines, 20, y)
  y += bodyLines.length * 7 + 12

  y = addAmountBox(doc, data.suma, data.moneda, y)
  y += 12

  y = addSignatures(doc, [
    { label: 'Beneficiar', name: beneficiar },
    { label: 'Casier', name: casier },
    { label: 'Pastor', name: pastor }
  ], y)

  addStampilaRect(doc, church, 128, pageH - 55, 62, 28)
  newFooter(doc, church)
  return doc
}

export const generateAdeverinta = generateDonatie

// ============================================================
// RAPORT FINANCIAR
// ============================================================
export function generateRaport(church, data, tip, interval) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.height

  newHeader(doc, church)

  let y = addTitle(doc, `RAPORT FINANCIAR - ${tip.toUpperCase()}`, 57)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(stripDiacritics(interval), 105, y, { align: 'center' })
  y += 14

  const drawRow = (label, val, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(11)
    doc.setTextColor(30, 30, 30)
    doc.text(stripDiacritics(label), 20, y)
    doc.text(stripDiacritics(String(val)), 190, y, { align: 'right' })
    y += 8
  }

  drawRow('Venituri totale:', `${data.venituri.toFixed(2)} lei`)
  drawRow('Cheltuieli totale:', `${data.cheltuieli.toFixed(2)} lei`)
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.5)
  doc.line(20, y, 190, y)
  y += 5
  drawRow('Sold net:', `${data.sold.toFixed(2)} lei`, true)

  y += 8
  if (data.byCategory?.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(20, 20, 20)
    doc.text('Detalii pe categorii:', 20, y)
    y += 8
    data.byCategory.forEach(cat => drawRow(`  ${cat.categorie}:`, `${cat.total.toFixed(2)} lei`))
  }

  addStampilaRect(doc, church, 128, pageH - 55, 62, 28)
  newFooter(doc, church)
  return doc
}
