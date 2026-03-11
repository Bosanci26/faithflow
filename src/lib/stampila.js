import { CULTE, stripDiacritics } from './constants'

export function generateStampilaSVG(church) {
  const cult = CULTE[church.denomination] || church.denomination || ''
  const name = church.name || ''
  const location = `${church.city || ''}, jud. ${church.county || ''}`

  const cultText = stripDiacritics(cult)
  const nameText = stripDiacritics(name)
  const locationText = stripDiacritics(location)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="100" viewBox="0 0 320 100">
  <rect x="3" y="3" width="314" height="94" fill="none" stroke="#B8860B" stroke-width="2.5" rx="4"/>
  <rect x="7" y="7" width="306" height="86" fill="none" stroke="#B8860B" stroke-width="1" rx="3"/>
  <text x="160" y="28" font-family="serif" font-size="9" font-weight="bold" fill="#B8860B" text-anchor="middle">${cultText}</text>
  <text x="160" y="55" font-family="serif" font-size="14" font-weight="bold" fill="#B8860B" text-anchor="middle">${nameText}</text>
  <text x="160" y="78" font-family="serif" font-size="10" fill="#B8860B" text-anchor="middle">${locationText}</text>
</svg>`
}

export function stampilaSVGtoDataURL(svgString) {
  const encoded = encodeURIComponent(svgString)
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}
