import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { DENOMINATIUNI } from '../lib/constants'
import './AuthPages.css'

export default function SetupPage() {
  const { user, signOut } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    churchName: user?.user_metadata?.church_name || '',
    denomination: user?.user_metadata?.denomination || 'Penticostala',
    city: user?.user_metadata?.city || '',
    county: user?.user_metadata?.county || '',
    pastorName: '',
    casierName: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const slug = form.churchName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 50)

    // Creează biserica
    const { data: church, error: churchErr } = await supabase
      .from('churches')
      .insert({
        name: form.churchName,
        slug,
        denomination: form.denomination,
        city: form.city,
        county: form.county,
        pastor_name: form.pastorName,
        casier_name: form.casierName
      })
      .select()
      .single()

    if (churchErr) {
      setError('Eroare la crearea bisericii: ' + churchErr.message)
      setLoading(false)
      return
    }

    // Adaugă userul ca owner
    const { error: memberErr } = await supabase
      .from('church_members')
      .insert({ user_id: user.id, church_id: church.id, role: 'owner' })

    if (memberErr) {
      setError('Eroare la asocierea contului: ' + memberErr.message)
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">✦</span>
            <span>FaithFlow</span>
          </div>
          <button onClick={toggle} className="theme-btn">{dark ? '☀️' : '🌙'}</button>
        </div>

        <h2 className="auth-title">Configurează-ți biserica</h2>
        <p className="auth-sub">Contul tău a fost creat. Completează informațiile bisericii pentru a continua.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Numele Bisericii *</label>
              <input
                value={form.churchName}
                onChange={set('churchName')}
                placeholder="Biserica Penticostala..."
                required
              />
            </div>
            <div className="form-group">
              <label>Denominatiune *</label>
              <select value={form.denomination} onChange={set('denomination')}>
                {DENOMINATIUNI.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Oras *</label>
              <input value={form.city} onChange={set('city')} placeholder="Cluj-Napoca" required />
            </div>
            <div className="form-group">
              <label>Judet *</label>
              <input value={form.county} onChange={set('county')} placeholder="Cluj" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Numele Pastorului *</label>
              <input value={form.pastorName} onChange={set('pastorName')} placeholder="Prenume Nume" required />
            </div>
            <div className="form-group">
              <label>Numele Casierului *</label>
              <input value={form.casierName} onChange={set('casierName')} placeholder="Prenume Nume" required />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-gold auth-submit" disabled={loading}>
            {loading ? 'Se salveaza...' : 'Continuă spre dashboard →'}
          </button>
        </form>

        <p className="auth-switch">
          <button onClick={signOut} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
            Ieși din cont
          </button>
        </p>
      </div>
    </div>
  )
}
