import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toRON, formatRON, CURRENCIES, formatCurrency } from '../../lib/constants'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './AcasaTab.css'

const ACTIUNI = [
  { icon: '📥', label: 'Venit nou', tab: 'adauga', type: 'venit' },
  { icon: '📤', label: 'Cheltuiala', tab: 'adauga', type: 'cheltuiala' },
  { icon: '📄', label: 'Chitanta', tab: 'documente', type: 'chitanta' },
  { icon: '📋', label: 'Proces Verbal', tab: 'documente', type: 'pv' }
]

function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('ro-RO', { month: 'short', year: '2-digit' })
    })
  }
  return months
}

export default function AcasaTab({ church, onNavigate }) {
  const [stats, setStats] = useState({ totalRON: 0, venituri: 0, cheltuieli: 0 })
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedback, setFeedback] = useState({ cat: 'Bug', msg: '' })
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    loadStats()
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline) }
  }, [church])

  const loadStats = async () => {
    setLoading(true)
    const months = getLast6Months()
    const sixMonthsAgo = months[0].key + '-01'

    const [{ data: ven }, { data: chel }] = await Promise.all([
      supabase.from('venituri').select('suma,moneda,data').eq('church_id', church.id),
      supabase.from('cheltuieli').select('suma,moneda,data').eq('church_id', church.id)
    ])

    const totalVen = (ven || []).reduce((s, r) => s + toRON(r.suma, r.moneda), 0)
    const totalChel = (chel || []).reduce((s, r) => s + toRON(r.suma, r.moneda), 0)
    setStats({ totalRON: totalVen - totalChel, venituri: totalVen, cheltuieli: totalChel })

    // Build chart data
    const monthMap = {}
    months.forEach(m => { monthMap[m.key] = { name: m.label, venituri: 0, cheltuieli: 0 } });
    (ven || []).forEach(r => {
      const k = r.data?.slice(0, 7)
      if (monthMap[k]) monthMap[k].venituri += toRON(r.suma, r.moneda)
    });
    (chel || []).forEach(r => {
      const k = r.data?.slice(0, 7)
      if (monthMap[k]) monthMap[k].cheltuieli += toRON(r.suma, r.moneda)
    })
    setChartData(months.map(m => ({
      ...monthMap[m.key],
      venituri: Math.round(monthMap[m.key].venituri * 100) / 100,
      cheltuieli: Math.round(monthMap[m.key].cheltuieli * 100) / 100
    })))

    setLoading(false)
  }

  const sendFeedback = () => {
    const subject = encodeURIComponent(`[Feedback FaithFlow] ${feedback.cat}`)
    const body = encodeURIComponent(`Biserica: ${church.name}\n\n${feedback.msg}`)
    window.location.href = `mailto:amarieilucian2007@gmail.com?subject=${subject}&body=${body}`
    setFeedbackOpen(false)
    setFeedback({ cat: 'Bug', msg: '' })
  }

  // Trial: created_at + 14 zile
  const trialDays = church?.created_at
    ? Math.max(0, 14 - Math.floor((Date.now() - new Date(church.created_at).getTime()) / 86400000))
    : null

  return (
    <div className="acasa-tab">
      {/* Offline banner */}
      {!isOnline && (
        <div style={{
          background: 'rgba(224,82,82,0.15)', border: '1px solid var(--danger)',
          color: 'var(--danger)', borderRadius: 10, padding: '8px 14px',
          marginBottom: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
        }}>
          📵 Mod offline — datele afisate pot sa nu fie actualizate
        </div>
      )}

      {/* Trial warning */}
      {trialDays !== null && trialDays <= 7 && (
        <div style={{
          background: trialDays <= 2 ? 'rgba(224,82,82,0.12)' : 'rgba(212,168,67,0.12)',
          border: `1px solid ${trialDays <= 2 ? 'var(--danger)' : 'var(--gold)'}`,
          color: trialDays <= 2 ? 'var(--danger)' : 'var(--gold)',
          borderRadius: 10, padding: '8px 14px', marginBottom: 12, fontSize: 13
        }}>
          ⏳ Trial expira in {trialDays} {trialDays === 1 ? 'zi' : 'zile'} — upgradeaza pentru acces complet
        </div>
      )}

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

      {/* Grafic evolutie 6 luni */}
      {!loading && chartData.some(d => d.venituri > 0 || d.cheltuieli > 0) && (
        <div className="card" style={{ marginBottom: 16, padding: '16px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>
            Evolutie ultimele 6 luni (RON)
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val, name) => [`${val.toFixed(2)} lei`, name === 'venituri' ? 'Venituri' : 'Cheltuieli']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="venituri" stroke="#4caf7d" strokeWidth={2} dot={false} name="venituri" />
              <Line type="monotone" dataKey="cheltuieli" stroke="#e05252" strokeWidth={2} dot={false} name="cheltuieli" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

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
