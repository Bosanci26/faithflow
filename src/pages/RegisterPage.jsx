import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { DENOMINATIUNI } from '../lib/constants'
import './AuthPages.css'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    churchName: '', denomination: 'Penticostala',
    city: '', county: '', fullName: '', email: '', password: ''
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

    const { error: err } = await signUp(form.email, form.password, {
      church_name: form.churchName,
      church_slug: slug,
      denomination: form.denomination,
      city: form.city,
      county: form.county,
      full_name: form.fullName
    })

    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide fade-in">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-icon">✦</span>
            <span>FaithFlow</span>
          </Link>
          <button onClick={toggle} className="theme-btn">{dark ? '☀️' : '🌙'}</button>
        </div>

        <h2 className="auth-title">Inregistreaza-ti biserica</h2>
        <p className="auth-sub">7 zile gratuit, fara card necesar</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Numele Bisericii *</label>
              <input value={form.churchName} onChange={set('churchName')} placeholder="Biserica Penticostala..." required />
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
          <div className="divider"></div>
          <div className="form-group">
            <label>Numele tau complet *</label>
            <input value={form.fullName} onChange={set('fullName')} placeholder="Ion Popescu" required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="ion@biserica.ro" required />
          </div>
          <div className="form-group">
            <label>Parola *</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Minim 8 caractere" minLength={8} required />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-gold auth-submit" disabled={loading}>
            {loading ? 'Se creeaza contul...' : 'Creeaza cont gratuit →'}
          </button>
        </form>

        <p className="auth-switch">
          Ai deja cont? <Link to="/login">Autentifica-te</Link>
        </p>
      </div>
    </div>
  )
}
