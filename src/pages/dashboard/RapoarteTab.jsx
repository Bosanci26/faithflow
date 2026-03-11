import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { toRON, formatRON } from '../../lib/constants'
import { generateRaport } from '../../lib/pdfGenerator'

const today = () => new Date().toISOString().split('T')[0]

function getInterval(tip) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (tip === 'Lunar') {
    const start = new Date(y, m, 1).toISOString().split('T')[0]
    const end = new Date(y, m + 1, 0).toISOString().split('T')[0]
    return { start, end, label: `Luna ${m + 1}/${y}` }
  }
  if (tip === 'Trimestrial') {
    const q = Math.floor(m / 3)
    const start = new Date(y, q * 3, 1).toISOString().split('T')[0]
    const end = new Date(y, q * 3 + 3, 0).toISOString().split('T')[0]
    return { start, end, label: `Trimestrul ${q + 1} - ${y}` }
  }
  if (tip === 'Anual') {
    return { start: `${y}-01-01`, end: `${y}-12-31`, label: `Anul ${y}` }
  }
  return null
}

export default function RapoarteTab({ church }) {
  const [tip, setTip] = useState('Lunar')
  const [customStart, setCustomStart] = useState(today())
  const [customEnd, setCustomEnd] = useState(today())
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const TIPS = ['Lunar', 'Trimestrial', 'Anual', 'Personalizat']

  const loadRaport = async () => {
    setLoading(true)
    setResult(null)
    const interval = tip === 'Personalizat'
      ? { start: customStart, end: customEnd, label: `${customStart} — ${customEnd}` }
      : getInterval(tip)

    const [{ data: ven }, { data: chel }] = await Promise.all([
      supabase.from('venituri').select('*').eq('church_id', church.id)
        .gte('data', interval.start).lte('data', interval.end),
      supabase.from('cheltuieli').select('*').eq('church_id', church.id)
        .gte('data', interval.start).lte('data', interval.end)
    ])

    const venituri = (ven || []).reduce((s, r) => s + toRON(r.suma, r.moneda), 0)
    const cheltuieli = (chel || []).reduce((s, r) => s + toRON(r.suma, r.moneda), 0)

    // By category
    const catMap = {}
    ;(ven || []).forEach(r => {
      const k = `V: ${r.categorie}`
      catMap[k] = (catMap[k] || 0) + toRON(r.suma, r.moneda)
    })
    ;(chel || []).forEach(r => {
      const k = `C: ${r.categorie}`
      catMap[k] = (catMap[k] || 0) + toRON(r.suma, r.moneda)
    })
    const byCategory = Object.entries(catMap).map(([categorie, total]) => ({ categorie, total }))
      .sort((a, b) => b.total - a.total)

    setResult({ venituri, cheltuieli, sold: venituri - cheltuieli, byCategory, interval })
    setLoading(false)
  }

  const handleDownload = () => {
    if (!result) return
    const doc = generateRaport(church, result, tip, result.interval.label)
    doc.save(`raport-${tip.toLowerCase()}-${result.interval.start}.pdf`)
  }

  return (
    <div>
      <h2 className="section-title">Rapoarte</h2>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {TIPS.map(t => (
          <button
            key={t}
            className={`btn btn-sm ${tip === t ? 'btn-gold' : 'btn-ghost'}`}
            onClick={() => { setTip(t); setResult(null) }}
          >
            {t}
          </button>
        ))}
      </div>

      {tip === 'Personalizat' && (
        <div className="card fade-in" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
            <label>Data inceput</label>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
            <label>Data sfarsit</label>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          </div>
        </div>
      )}

      <button
        className="btn btn-gold"
        style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
        onClick={loadRaport}
        disabled={loading}
      >
        {loading ? 'Se genereaza...' : `Genereaza raport ${tip}`}
      </button>

      {result && (
        <div className="fade-in">
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, fontWeight: 600 }}>
              {result.interval.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Venituri totale</span>
                <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, color: 'var(--success)', fontSize: 16 }}>
                  {formatRON(result.venituri)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cheltuieli totale</span>
                <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, color: 'var(--danger)', fontSize: 16 }}>
                  {formatRON(result.cheltuieli)}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Sold net</span>
                <span style={{
                  fontFamily: 'Playfair Display',
                  fontWeight: 700,
                  fontSize: 20,
                  color: result.sold >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  {result.sold >= 0 ? '+' : ''}{formatRON(result.sold)}
                </span>
              </div>
            </div>
          </div>

          {result.byCategory.length > 0 && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Pe categorii</div>
              {result.byCategory.map((cat, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: i < result.byCategory.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>
                    <span style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: cat.categorie.startsWith('V:') ? 'var(--success)' : 'var(--danger)',
                      marginRight: 8
                    }}></span>
                    {cat.categorie.replace(/^[VC]: /, '')}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                      ({cat.categorie.startsWith('V:') ? 'venit' : 'cheltuiala'})
                    </span>
                  </span>
                  <span style={{ fontFamily: 'Playfair Display', fontWeight: 600, fontSize: 13 }}>
                    {formatRON(cat.total)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn btn-gold"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleDownload}
          >
            Descarca raport PDF
          </button>
        </div>
      )}
    </div>
  )
}
