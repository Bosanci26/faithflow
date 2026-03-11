import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toRON, formatRON, CURRENCIES, formatCurrency } from '../../lib/constants'
import './AcasaTab.css'

const ACTIUNI = [
  { icon: '📥', label: 'Venit nou', tab: 'adauga', type: 'venit' },
  { icon: '📤', label: 'Cheltuiala', tab: 'adauga', type: 'cheltuiala' },
  { icon: '📄', label: 'Chitanta', tab: 'documente', type: 'chitanta' },
  { icon: '📋', label: 'Proces Verbal', tab: 'documente', type: 'pv' }
]

export default function AcasaTab({ church, onNavigate }) {
  const [stats, setStats] = useState({ totalRON: 0, venituri: 0, cheltuieli: 0, byCat: [] })
  const [loading, setLoading] = useState(true)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedback, setFeedback] = useState({ cat: 'Bug', msg: '' })

  useEffect(() => {
    loadStats()
  }, [church])

  const loadStats = async () => {
    setLoading(true)
    const [{ data: ven }, { data: chel }] = await Promise.all([
      supabase.from('venituri').select('suma,moneda').eq('church_id', church.id),
      supabase.from('cheltuieli').select('suma,moneda').eq('church_id', church.id)
    ])

    const totalVen = (ven || []).reduce((s, r) => s + toRON(r.suma, r.moneda), 0)
    const totalChel = (chel || []).reduce((s, r) => s + toRON(r.suma, r.moneda), 0)
    setStats({
      totalRON: totalVen - totalChel,
      venituri: totalVen,
      cheltuieli: totalChel
    })
    setLoading(false)
  }

  const sendFeedback = () => {
    const subject = encodeURIComponent(`[Feedback FaithFlow] ${feedback.cat}`)
    const body = encodeURIComponent(`Biserica: ${church.name}\n\n${feedback.msg}`)
    window.location.href = `mailto:amarieilucian2007@gmail.com?subject=${subject}&body=${body}`
    setFeedbackOpen(false)
    setFeedback({ cat: 'Bug', msg: '' })
  }

  return (
    <div className="acasa-tab">
      {/* Patrimoniu total */}
      <div className="patrimoniu-card card fade-in">
        <div className="patrimoniu-label">Sold Total Patrimoniu</div>
        {loading ? (
          <div className="patrimoniu-loading">Se calculeaza...</div>
        ) : (
          <div className={`patrimoniu-val ${stats.totalRON >= 0 ? 'positive' : 'negative'}`}>
            {formatRON(Math.abs(stats.totalRON))}
            <span className="patrimoniu-sign">{stats.totalRON >= 0 ? '▲' : '▼'}</span>
          </div>
        )}
        <div className="patrimoniu-sub">echivalent RON din toate monedele</div>
      </div>

      {/* Venituri / Cheltuieli cards */}
      <div className="summary-row">
        <div className="summary-card card-sm">
          <div className="summary-icon income">📥</div>
          <div>
            <div className="summary-label">Venituri</div>
            <div className="summary-val income">{formatRON(stats.venituri)}</div>
          </div>
          <button className="summary-link" onClick={() => onNavigate('tranzactii')}>
            Pe categorii →
          </button>
        </div>
        <div className="summary-card card-sm">
          <div className="summary-icon expense">📤</div>
          <div>
            <div className="summary-label">Cheltuieli</div>
            <div className="summary-val expense">{formatRON(stats.cheltuieli)}</div>
          </div>
          <button className="summary-link" onClick={() => onNavigate('tranzactii')}>
            Pe categorii →
          </button>
        </div>
      </div>

      {/* Actiuni rapide */}
      <div className="actiuni-section">
        <div className="section-label">Actiuni rapide</div>
        <div className="actiuni-grid">
          {ACTIUNI.map((a, i) => (
            <button
              key={i}
              className="actiune-btn card-sm"
              onClick={() => onNavigate(a.tab)}
            >
              <span className="actiune-icon">{a.icon}</span>
              <span className="actiune-label">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback bubble */}
      <button className="feedback-bubble" onClick={() => setFeedbackOpen(true)} title="Trimite feedback">
        💬
      </button>

      {/* Feedback modal */}
      {feedbackOpen && (
        <div className="modal-overlay" onClick={() => setFeedbackOpen(false)}>
          <div className="modal-card fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Trimite Feedback</h3>
            <div className="form-group">
              <label>Categorie</label>
              <select value={feedback.cat} onChange={e => setFeedback(f => ({ ...f, cat: e.target.value }))}>
                <option>Bug</option>
                <option>Sugestie</option>
                <option>Altele</option>
              </select>
            </div>
            <div className="form-group">
              <label>Mesaj</label>
              <textarea
                rows={4}
                placeholder="Descrie problema sau sugestia..."
                value={feedback.msg}
                onChange={e => setFeedback(f => ({ ...f, msg: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setFeedbackOpen(false)}>Anuleaza</button>
              <button className="btn btn-gold btn-sm" onClick={sendFeedback} disabled={!feedback.msg.trim()}>
                Trimite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
