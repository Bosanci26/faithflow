import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CURRENCIES, VENITURI_CATEGORII, CHELTUIELI_CATEGORII } from '../../lib/constants'

const today = () => new Date().toISOString().split('T')[0]

export default function AdaugaTab({ church }) {
  const [type, setType] = useState('venit')
  const [form, setForm] = useState({ data: today(), suma: '', moneda: 'RON', categorie: '', descriere: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const cats = type === 'venit' ? VENITURI_CATEGORII : CHELTUIELI_CATEGORII

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.suma || parseFloat(form.suma) <= 0) { setError('Suma trebuie sa fie mai mare decat 0'); return }
    setError('')
    setLoading(true)

    const table = type === 'venit' ? 'venituri' : 'cheltuieli'
    const { error: err } = await supabase.from(table).insert({
      church_id: church.id,
      data: form.data,
      suma: parseFloat(form.suma),
      moneda: form.moneda,
      categorie: form.categorie || cats[0],
      descriere: form.descriere
    })

    setLoading(false)
    if (err) { setError(err.message); return }

    setSuccess(true)
    setForm({ data: today(), suma: '', moneda: 'RON', categorie: '', descriere: '' })
    setTimeout(() => setSuccess(false), 2500)
  }

  return (
    <div>
      <h2 className="section-title">Adauga tranzactie</h2>

      <div className="toggle-pill" style={{ marginBottom: 20 }}>
        <button className={type === 'venit' ? 'active' : ''} onClick={() => setType('venit')}>
          📥 Venit
        </button>
        <button className={type === 'cheltuiala' ? 'active' : ''} onClick={() => setType('cheltuiala')}>
          📤 Cheltuiala
        </button>
      </div>

      {success && (
        <div style={{ background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.3)', color: 'var(--success)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>
          ✓ {type === 'venit' ? 'Venitul' : 'Cheltuiala'} a fost inregistrat/a cu succes!
        </div>
      )}

      <form onSubmit={handleSubmit} className="card fade-in">
        <div className="form-group">
          <label>Data *</label>
          <input type="date" value={form.data} onChange={set('data')} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Suma *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={form.suma}
              onChange={set('suma')}
              required
            />
          </div>
          <div className="form-group">
            <label>Moneda</label>
            <select value={form.moneda} onChange={set('moneda')}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Categorie</label>
          <select value={form.categorie} onChange={set('categorie')}>
            <option value="">— Selecteaza —</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Descriere</label>
          <textarea
            rows={3}
            placeholder="Detalii optionale..."
            value={form.descriere}
            onChange={set('descriere')}
          />
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', padding: 13, borderRadius: 12 }} disabled={loading}>
          {loading ? 'Se salveaza...' : `Salveaza ${type === 'venit' ? 'venitul' : 'cheltuiala'}`}
        </button>
      </form>
    </div>
  )
}
