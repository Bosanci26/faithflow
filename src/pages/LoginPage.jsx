import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import './AuthPages.css'

export default function LoginPage() {
  const { signIn } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(form.email, form.password)
    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-icon">✦</span>
            <span>FaithFlow</span>
          </Link>
          <button onClick={toggle} className="theme-btn">{dark ? '☀️' : '🌙'}</button>
        </div>

        <h2 className="auth-title">Bun venit inapoi</h2>
        <p className="auth-sub">Autentifica-te in contul tau</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="email@biserica.ro"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Parola</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-gold auth-submit" disabled={loading}>
            {loading ? 'Se autentifica...' : 'Autentificare →'}
          </button>
        </form>

        <p className="auth-switch">
          Nu ai cont? <Link to="/register">Inregistreaza-te gratuit</Link>
        </p>
      </div>
    </div>
  )
}
