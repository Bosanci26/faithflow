import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toRON, formatCurrency, formatRON, CURRENCIES, CURRENCY_SYMBOLS } from '../../lib/constants'

export default function ConturiTab({ church }) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [drillItems, setDrillItems] = useState([])

  useEffect(() => { loadAll() }, [church])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: ven }, { data: chel }] = await Promise.all([
      supabase.from('venituri').select('*').eq('church_id', church.id),
      supabase.from('cheltuieli').select('*').eq('church_id', church.id)
    ])

    const result = {}
    CURRENCIES.forEach(m => {
      const venM = (ven || []).filter(r => r.moneda === m)
      const chelM = (chel || []).filter(r => r.moneda === m)
      const totalVen = venM.reduce((s, r) => s + r.suma, 0)
      const totalChel = chelM.reduce((s, r) => s + r.suma, 0)
      result[m] = {
        venituri: totalVen,
        cheltuieli: totalChel,
        sold: totalVen - totalChel,
        soldRON: toRON(totalVen - totalChel, m),
        venItems: venM.map(r => ({ ...r, tip: 'venit' })),
        chelItems: chelM.map(r => ({ ...r, tip: 'cheltuiala' }))
      }
    })
    setData(result)
    setLoading(false)
  }

  const handleSelectMoneda = (m) => {
    if (selected === m) { setSelected(null); return }
    setSelected(m)
    const all = [
      ...data[m].venItems,
      ...data[m].chelItems
    ].sort((a, b) => new Date(b.data) - new Date(a.data))
    setDrillItems(all)
  }

  const totalPatrimoniu = Object.values(data).reduce((s, d) => s + (d.soldRON || 0), 0)

  const SYM = CURRENCY_SYMBOLS

  if (loading) return <div className="empty-state"><p>Se incarca...</p></div>

  return (
    <div>
      <h2 className="section-title">Conturi</h2>

      <div className="card fade-in" style={{ textAlign: 'center', marginBottom: 16, background: 'linear-gradient(135deg, var(--card) 0%, rgba(212,168,67,0.06) 100%)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Patrimoniu total (echivalent RON)
        </div>
        <div style={{
          fontFamily: 'Playfair Display',
          fontSize: 36,
          fontWeight: 700,
          color: totalPatrimoniu >= 0 ? 'var(--success)' : 'var(--danger)'
        }}>
          {formatRON(Math.abs(totalPatrimoniu))}
          <span style={{ fontSize: 16, marginLeft: 8 }}>{totalPatrimoniu >= 0 ? '▲' : '▼'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CURRENCIES.map(m => {
          const d = data[m]
          if (!d) return null
          const isActive = selected === m
          return (
            <div key={m}>
              <button
                className={`card-sm fade-in`}
                onClick={() => handleSelectMoneda(m)}
                style={{
                  width: '100%',
                  border: `1px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  background: isActive ? 'rgba(212,168,67,0.07)' : 'var(--card)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  transition: 'all 0.15s',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(212,168,67,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Playfair Display',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  fontSize: 14,
                  flexShrink: 0
                }}>
                  {SYM[m]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{m}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                    <span style={{ color: 'var(--success)' }}>+{d.venituri.toFixed(2)}</span>
                    <span style={{ color: 'var(--danger)' }}>-{d.cheltuieli.toFixed(2)}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: 'Playfair Display',
                    fontWeight: 700,
                    fontSize: 17,
                    color: d.sold >= 0 ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {d.sold >= 0 ? '+' : ''}{formatCurrency(d.sold, m)}
                  </div>
                  {m !== 'RON' && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      ≈ {formatRON(d.soldRON)}
                    </div>
                  )}
                </div>
                <span style={{ color: 'var(--gold)', fontSize: 14 }}>{isActive ? '▲' : '▼'}</span>
              </button>

              {isActive && (
                <div className="fade-in" style={{ margin: '4px 0 0 0', display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8 }}>
                  {drillItems.length === 0 ? (
                    <div className="card-sm" style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nicio tranzactie in {m}</div>
                  ) : drillItems.map(item => (
                    <div key={item.id + item.tip} className="card-sm" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span>{item.tip === 'venit' ? '📥' : '📤'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.categorie || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.data}</div>
                      </div>
                      <div style={{
                        fontFamily: 'Playfair Display',
                        fontWeight: 700,
                        fontSize: 14,
                        color: item.tip === 'venit' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {item.tip === 'cheltuiala' ? '-' : '+'}{formatCurrency(item.suma, m)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
