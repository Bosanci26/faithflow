import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toRON, formatCurrency, formatRON, CURRENCIES } from '../../lib/constants'

const FILTERS = ['Toate', 'Venituri', 'Cheltuieli']

export default function TranzactiiTab({ church }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Toate')
  const [monedaFilter, setMonedaFilter] = useState('Toate')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { loadAll() }, [church])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: ven }, { data: chel }] = await Promise.all([
      supabase.from('venituri').select('*').eq('church_id', church.id).order('data', { ascending: false }),
      supabase.from('cheltuieli').select('*').eq('church_id', church.id).order('data', { ascending: false })
    ])
    const all = [
      ...(ven || []).map(r => ({ ...r, tip: 'venit' })),
      ...(chel || []).map(r => ({ ...r, tip: 'cheltuiala' }))
    ].sort((a, b) => new Date(b.data) - new Date(a.data))
    setItems(all)
    setLoading(false)
  }

  const handleDelete = async (item) => {
    if (!confirm(`Stergi aceasta ${item.tip === 'venit' ? 'incasare' : 'cheltuiala'} de ${formatCurrency(item.suma, item.moneda)}?`)) return
    setDeleting(item.id)
    const table = item.tip === 'venit' ? 'venituri' : 'cheltuieli'
    await supabase.from(table).delete().eq('id', item.id)
    setDeleting(null)
    loadAll()
  }

  const monede = ['Toate', ...CURRENCIES]
  const filtered = items.filter(it => {
    const matchType = filter === 'Toate' || (filter === 'Venituri' && it.tip === 'venit') || (filter === 'Cheltuieli' && it.tip === 'cheltuiala')
    const matchMon = monedaFilter === 'Toate' || it.moneda === monedaFilter
    return matchType && matchMon
  })

  const totalVen = filtered.filter(i => i.tip === 'venit').reduce((s, i) => s + toRON(i.suma, i.moneda), 0)
  const totalChel = filtered.filter(i => i.tip === 'cheltuiala').reduce((s, i) => s + toRON(i.suma, i.moneda), 0)

  return (
    <div>
      <h2 className="section-title">Tranzactii</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="toggle-pill" style={{ flex: 1, minWidth: 200 }}>
          {FILTERS.map(f => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <select
          value={monedaFilter}
          onChange={e => setMonedaFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 90 }}
        >
          {monede.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {filter !== 'Cheltuieli' && filter !== 'Venituri' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div className="card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>VENITURI</div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: 16, color: 'var(--success)', fontWeight: 700 }}>{formatRON(totalVen)}</div>
          </div>
          <div className="card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CHELTUIELI</div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: 16, color: 'var(--danger)', fontWeight: 700 }}>{formatRON(totalChel)}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><p>Se incarca...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>Nicio tranzactie gasita</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(item => (
            <div key={item.id + item.tip} className="card-sm fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>{item.tip === 'venit' ? '📥' : '📤'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
                  {item.categorie || '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {item.data} {item.descriere ? `· ${item.descriere}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontFamily: 'Playfair Display',
                  fontWeight: 700,
                  fontSize: 15,
                  color: item.tip === 'venit' ? 'var(--success)' : 'var(--danger)'
                }}>
                  {item.tip === 'cheltuiala' ? '-' : '+'}{formatCurrency(item.suma, item.moneda)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  ≈ {formatRON(toRON(item.suma, item.moneda))}
                </div>
              </div>
              <button
                className="btn btn-danger btn-sm"
                style={{ padding: '4px 10px', flexShrink: 0 }}
                onClick={() => handleDelete(item)}
                disabled={deleting === item.id}
              >
                {deleting === item.id ? '...' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
