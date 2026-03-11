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
    // fallback: draw rectangle with text
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
  doc.text('Document generat - Platforma FaithFlow', 105, pageH - 10, { align: 'center' })
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
  doc.text(`Nr. ${stripDiacritics(data.nr || '')}`, 105, 51, { align: 'center' })

  let y = 62
  const sym = CURRENCY_SYMBOLS[data.moneda] || data.moneda
  const fields = [
    ['Data:', data.data],
    ['Persoana:', stripDiacritics(data.persoana || '')],
    ['Suma:', `${data.suma} ${sym}`],
    ['Destinatie:', stripDiacritics(data.detalii || '')]
  ]

  doc.setFontSize(10)
  fields.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(val || ''), 55, y)
    y += 8
  })

  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const bodyText = stripDiacritics(
    `Am primit de la ${data.persoana || '........'} suma de ${data.suma} ${sym}, reprezentand ${data.detalii || '........'}.`
  )
  const lines = doc.splitTextToSize(bodyText, 165)
  doc.text(lines, 20, y)
  y += lines.length * 6 + 10

  // Semnaturi
  doc.setFont('helvetica', 'bold')
  doc.text('Casier / Trezorier', 30, y)
  doc.text('Pastor / Presedinte', 130, y)
  doc.setFont('helvetica', 'normal')
  doc.line(20, y + 15, 80, y + 15)
  doc.line(120, y + 15, 180, y + 15)

  addStampila(doc, church, 120, y + 18, 60, 20)

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
  doc.text(`Nr. ${stripDiacritics(data.nr || '')}`, 105, 51, { align: 'center' })

  let y = 62
  const sym = CURRENCY_SYMBOLS[data.moneda] || data.moneda

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Data:', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(String(data.data || ''), 55, y)
  y += 10

  const bodyText = stripDiacritics(
    `Subsemnatul/a, ${data.persoana || '........'}, in calitate de reprezentant al ${church.name || 'bisericii'}, ` +
    `adevereste ca in data de ${data.data || '........'} s-a efectuat urmatoarea operatiune financiara: ` +
    `${data.detalii || '........'}, in valoare de ${data.suma || '0'} ${sym}.`
  )
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(bodyText, 165)
  doc.text(lines, 20, y)
  y += lines.length * 6 + 15

  doc.setFont('helvetica', 'bold')
  doc.text('Casier / Trezorier', 30, y)
  doc.text('Pastor / Presedinte', 130, y)
  doc.setFont('helvetica', 'normal')
  doc.line(20, y + 15, 80, y + 15)
  doc.line(120, y + 15, 180, y + 15)

  addStampila(doc, church, 120, y + 18, 60, 20)

  baseFooter(doc, pageH)
  return doc
}

export function generateAdeverinta(church, data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.height

  baseHeader(doc, church)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(20)
  doc.text('ADEVERINTA AJUTOR SOCIAL', 105, 44, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nr. ${stripDiacritics(data.nr || '')}`, 105, 51, { align: 'center' })

  let y = 62
  const sym = CURRENCY_SYMBOLS[data.moneda] || data.moneda

  const bodyText = stripDiacritics(
    `Prin prezenta se adevereste ca ${data.persoana || '........'} a beneficiat de ajutor social ` +
    `din partea ${church.name || 'bisericii'}, in valoare de ${data.suma || '0'} ${sym}, ` +
    `acordat in data de ${data.data || '........'}, pentru urmatorul scop: ${data.detalii || '........'}.`
  )
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(bodyText, 165)
  doc.text(lines, 20, y)
  y += lines.length * 6 + 15

  doc.setFont('helvetica', 'bold')
  doc.text('Casier / Trezorier', 30, y)
  doc.text('Pastor / Presedinte', 130, y)
  doc.setFont('helvetica', 'normal')
  doc.line(20, y + 15, 80, y + 15)
  doc.line(120, y + 15, 180, y + 15)

  addStampila(doc, church, 120, y + 18, 60, 20)

  baseFooter(doc, pageH)
  return doc
}

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
