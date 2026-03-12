export const RATE = { RON: 1, EUR: 5, GBP: 5.8, USD: 4.6 }
export const CURRENCIES = ['RON', 'EUR', 'GBP', 'USD']
export const CURRENCY_SYMBOLS = { RON: 'lei', EUR: '€', GBP: '£', USD: '$' }

export const VENITURI_CATEGORII = [
  'Zeciuiala', 'Daruri', 'Donatii',
  'Misiuni', 'Constructie', 'Alte venituri'
]

export const CHELTUIELI_CATEGORII = [
  'Chirie', 'Utilitati', 'Salariu pastor', 'Misiuni', 'Intretinere',
  'Transport', 'Consumabile', 'Constructie', 'Echipamente', 'Alte cheltuieli'
]

export const DENOMINATIUNI = [
  'Penticostala', 'Baptista', 'Adventista', 'Ortodoxa',
  'Greco-Catolica', 'Reformata', 'Alta'
]

export const CULTE = {
  'Penticostala': 'Cultul Crestin Penticostal din Romania',
  'Baptista': 'Uniunea Bisericilor Crestine Baptiste din Romania',
  'Adventista': 'Biserica Adventista de Ziua a Saptea din Romania',
  'Ortodoxa': 'Biserica Ortodoxa Romana',
  'Greco-Catolica': 'Biserica Romana Unita cu Roma, Greco-Catolica',
  'Reformata': 'Biserica Reformata din Romania',
  'Alta': ''
}

export const SUPER_ADMIN_EMAIL = 'admin@faithflow.app'

export const toRON = (suma, moneda) => suma * RATE[moneda]

export const formatCurrency = (suma, moneda) => {
  const sym = CURRENCY_SYMBOLS[moneda]
  if (moneda === 'RON') return `${suma.toFixed(2)} ${sym}`
  return `${sym}${suma.toFixed(2)}`
}

export const formatRON = (suma) => `${suma.toFixed(2)} lei`

export const stripDiacritics = (str) =>
  str
    .replace(/ă/g, 'a').replace(/Ă/g, 'A')
    .replace(/â/g, 'a').replace(/Â/g, 'A')
    .replace(/î/g, 'i').replace(/Î/g, 'I')
    .replace(/ș/g, 's').replace(/Ș/g, 'S')
    .replace(/ț/g, 't').replace(/Ț/g, 'T')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ţ/g, 't').replace(/Ţ/g, 'T')
