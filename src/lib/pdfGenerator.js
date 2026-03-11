import { jsPDF } from 'jspdf'
import { CULTE, CURRENCY_SYMBOLS, stripDiacritics } from './constants'
import { generateStampilaSVG, stampilaSVGtoDataURL } from './stampila'

function addStampila(doc, church, x, y, w = 80, h = 25) {
  if (church.stamp_url) {
    try {
      doc.addImage(church.stamp_url, 'PNG', x, y, w, h)
      return
    } catch {}
  }
  const svg = generateStampilaSVG(church)
  const dataUrl = stampilaSVGtoDataURL(svg)
  try {
    doc.addImage(dataUrl, 'SVG', x, y, w, h)
  } catch {
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.5)
    doc.rect(x, y, w, h)
    doc.setFontSize(7)
    doc.setTextColor(184, 134, 11)
    doc.text(stripDiacritics(church.name || ''), x + w / 2, y + h / 2, { align: 'center' })
    doc.setTextColor(0)
  }
}

function baseHeader(doc, church) {
  const cult = CULTE[church.denomination] || church.denomination || ''
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(stripDiacritics(cult), 105, 15, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(20)
  doc.text(stripDiacritics(church.name || ''), 105, 22, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text(stripDiacritics(`${church.city || ''}, jud. ${church.county || ''}`), 105, 28, { align: 'center' })

  doc.setDrawColor(212, 168, 67)
  doc.setLineWidth(0.8)
  doc.line(15, 32, 195, 32)
}

function baseFooter(doc, pageH) {
  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.text('Document generat automat - FaithFlow', 105, pageH - 10, { align: 'center' })
}

export function generateChitanta(church, data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.height

  baseHeader(doc, church)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(20)
  doc.text('CHITANTA', 105, 44, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nr. ${stripDiacritics(String(data.nr || ''))}`, 105, 51, { align: 'center' })

  let y = 62
  const sym = CURRENCY_SYMBOLS[data.moneda] || data.moneda
  const casier = stripDiacritics(data.casier || church.casier_name || '')

  const fields = [
    ['Data:', data.data],
    ['Donator:', stripDiacritics(data.donator || data.persoana || '')],
    ['Suma:', `${data.suma} ${sym}`],
    ['Categorie:', stripDiacritics(data.categorie || '')],
    ['Scopul donatiei:', stripDiacritics(data.scop || data.detalii || '—')],
    ['Casier:', casier]
  ]

  doc.setFontSize(10)
  fields.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(val || ''), 65, y)
    y += 8
  })

  y += 4
  const bodyText = stripDiacritics(
    `Am primit de la ${data.donator || data.persoana || '........'} suma de ${data.suma} ${sym}, ` +
    `reprezentand ${data.scop || data.detalii || '........'}.`
  )
  const lines = doc.splitTextToSize(bodyText, 165)
  doc.text(lines, 20, y)
  y += lines.length * 6 + 14

  // Only Casier signature
  doc.setFont('helvetica', 'bold')
  doc.text('Casier', 30, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(casier, 30, y + 6)
  doc.line(20, y + 15, 80, y + 15)

  addStampila(doc, church, 120, y - 4, 60, 22)

  baseFooter(doc, pageH)
  return doc
}

export function generateProcesVerbal(church, data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.height

  baseHeader(doc, church)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(20)
  doc.text('PROCES VERBAL', 105, 44, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nr. ${stripDiacritics(String(data.nr || ''))}`, 105, 51, { align: 'center' })

  let y = 62
  const sym = CURRENCY_SYMBOLS[data.moneda] || data.moneda
  const casier = stripDiacritics(data.casier || church.casier_name || '')
  const pastor = stripDiacritics(data.pastor || church.pastor_name || '')

  const fields = [
    ['Data:', data.data],
    ['Tip serviciu:', stripDiacritics(data.tipServiciu || data.detalii || '')],
    ['Suma colectata:', `${data.suma} ${sym}`],
    ['Casier:', casier],
    ['Pastor:', pastor],
    ['Martor 1:', stripDiacritics(data.martor1 || '')],
    ['Martor 2:', stripDiacritics(data.martor2 || '')],
    ['Observatii:', stripDiacritics(data.observatii || '—')]
  ]

  doc.setFontSize(10)
  fields.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(val || ''), 65, y)
    y += 8
  })

  y += 6
  const bodyText = stripDiacritics(
    `Subsemnatii, in calitate de reprezentanti ai ${church.name || 'bisericii'}, ` +
    `adeverim ca in data de ${data.data || '........'} s-a colectat suma de ${data.suma} ${sym} ` +
    `la ${data.tipServiciu || data.detalii || 'serviciul de inchinare'}.`
  )
  const lines = doc.splitTextToSize(bodyText, 165)
  doc.text(lines, 20, y)
  y += lines.length * 6 + 12

  // Signatures: Casier + Pastor + Martori
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Casier', 20, y)
  doc.text('Pastor', 85, y)
  doc.text('Martor 1', 140, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(casier, 20, y + 6)
  doc.text(pastor, 85, y + 6)

  doc.line(20, y + 15, 75, y + 15)
  doc.line(85, y + 15, 130, y + 15)
  doc.line(140, y + 15, 190, y + 15)

  y += 22
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Martor 2', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.line(20, y + 15, 75, y + 15)

  addStampila(doc, church, 125, y - 5, 60, 22)

  baseFooter(doc, pageH)
  return doc
}

export function generateDonatie(church, data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.height

  baseHeader(doc, church)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(20)
  doc.text('DONATIE', 105, 44, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nr. ${stripDiacritics(String(data.nr || ''))}`, 105, 51, { align: 'center' })

  let y = 62
  const sym = CURRENCY_SYMBOLS[data.moneda] || data.moneda
  const casier = stripDiacritics(data.casier || church.casier_name || '')
  const pastor = stripDiacritics(data.pastor || church.pastor_name || '')
  const ci = data.serieCI && data.nrCI ? `${data.serieCI} ${data.nrCI}` : '—'

  const fields = [
    ['Data:', data.data],
    ['Tip donatie:', stripDiacritics(data.tipDonatie || 'Donatie financiara')],
    ['Beneficiar:', stripDiacritics(data.beneficiar || data.persoana || '')],
    ['Serie/Nr. CI:', stripDiacritics(ci)],
    ['Adresa:', stripDiacritics(data.adresa || '—')],
    ['Suma:', `${data.suma} ${sym}`],
    ['Casier:', casier],
    ['Pastor:', pastor]
  ]

  doc.setFontSize(10)
  fields.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(val || ''), 65, y)
    y += 8
  })

  y += 4
  const bodyText = stripDiacritics(
    `Prin prezenta se adevereste ca ${data.beneficiar || data.persoana || '........'}, ` +
    `posesor al C.I. seria ${data.serieCI || '...'} nr. ${data.nrCI || '......'}, ` +
    `a primit o ${data.tipDonatie || 'donatie'} in valoare de ${data.suma} ${sym} ` +
    `din partea ${church.name || 'bisericii'}, acordata in data de ${data.data || '........'}.`
  )
  const lines = doc.splitTextToSize(bodyText, 165)
  doc.text(lines, 20, y)
  y += lines.length * 6 + 12

  // Signatures: Casier + Pastor
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Casier', 20, y)
  doc.text('Pastor', 130, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(casier, 20, y + 6)
  doc.text(pastor, 130, y + 6)

  doc.line(20, y + 15, 90, y + 15)
  doc.line(120, y + 15, 190, y + 15)

  addStampila(doc, church, 120, y + 18, 60, 20)

  baseFooter(doc, pageH)
  return doc
}

// Keep old name as alias for history re-download
export const generateAdeverinta = generateDonatie

export function generateRaport(church, data, tip, interval) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.height

  baseHeader(doc, church)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(20)
  doc.text(stripDiacritics(`RAPORT FINANCIAR - ${tip.toUpperCase()}`), 105, 44, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(stripDiacritics(interval), 105, 51, { align: 'center' })

  let y = 60

  const drawRow = (label, val, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(10)
    doc.text(stripDiacritics(label), 20, y)
    doc.text(stripDiacritics(String(val)), 160, y, { align: 'right' })
    y += 7
  }

  drawRow('Venituri totale:', `${data.venituri.toFixed(2)} lei`, false)
  drawRow('Cheltuieli totale:', `${data.cheltuieli.toFixed(2)} lei`, false)
  doc.setDrawColor(200)
  doc.line(20, y, 190, y)
  y += 3
  drawRow('Sold net:', `${data.sold.toFixed(2)} lei`, true)

  y += 5
  if (data.byCategory?.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Detalii pe categorii:', 20, y)
    y += 7
    data.byCategory.forEach(cat => {
      drawRow(`  ${cat.categorie}:`, `${cat.total.toFixed(2)} lei`)
    })
  }

  addStampila(doc, church, 130, pageH - 45, 55, 18)

  baseFooter(doc, pageH)
  return doc
}
