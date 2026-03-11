import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CURRENCIES } from '../../lib/constants'
import { generateStampilaSVG, stampilaSVGtoDataURL } from '../../lib/stampila'
import { generateChitanta, generateProcesVerbal, generateAdeverinta } from '../../lib/pdfGenerator'

const today = () => new Date().toISOString().split('T')[0]

const TIPURI = [
  { id: 'chitanta', label: 'Chitanta', icon: '🧾' },
  { id: 'proces_verbal', label: 'Proces Verbal', icon: '📋' },
  { id: 'adeverinta', label: 'Adeverinta Ajutor Social', icon: '📝' }
]

export default function DocumenteTab({ church, refreshChurch }) {
  const [subTab, setSubTab] = useState('genereaza')
  const [stampAccepted, setStampAccepted] = useState(() => {
    return !!localStorage.getItem(`stamp-accepted-${church?.id}`)
  })
  const [tip, setTip] = useState('chitanta')
  const [form, setForm] = useState({ nr: '', data: today(), persoana: '', suma: '', moneda: 'RON', detalii: '' })
  const [generating, setGenerating] = useState(false)
  const [success, setSuccess] = useState('')
  const [docs, setDocs] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  useEffect(() => {
    if (subTab === 'istoric') loadDocs()
  }, [subTab, church])

  const loadDocs = async () => {
    setLoadingDocs(true)
    const { data } = await supabase.from('documente').select('*')
      .eq('church_id', church.id)
      .order('created_at', { ascending: false })
    setDocs(data || [])
    setLoadingDocs(false)
  }

  const handleAcceptStamp = () => {
    localStorage.setItem(`stamp-accepted-${church.id}`, '1')
    setStampAccepted(true)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!form.nr || !form.persoana || !form.suma) return
    setGenerating(true)

    const data = { ...form, suma: parseFloat(form.suma) }

    let doc
    if (tip === 'chitanta') doc = generateChitanta(church, data)
    else if (tip === 'proces_verbal') doc = generateProcesVerbal(church, data)
    else doc = generateAdeverinta(church, data)

    const filename = `${tip}-${form.nr}-${form.data}.pdf`
    doc.save(filename)

    // Save to history
    await supabase.from('documente').insert({
      church_id: church.id,
      tip,
      nr: form.nr,
      data: form.data,
      suma: parseFloat(form.suma),
      moneda: form.moneda,
      persoana: form.persoana,
      detalii: form.detalii
    })

    setSuccess(`${TIPURI.find(t => t.id === tip)?.label} nr. ${form.nr} generata si descarcata!`)
    setForm({ nr: '', data: today(), persoana: '', suma: '', moneda: 'RON', detalii: '' })
    setTimeout(() => setSuccess(''), 4000)
    setGenerating(false)
  }

  const handleRedownload = (doc) => {
    const data = {
      nr: doc.nr,
      data: doc.data,
      persoana: doc.persoana,
      suma: doc.suma,
      moneda: doc.moneda,
      detalii: doc.detalii
    }
    let pdfDoc
    if (doc.tip === 'chitanta') pdfDoc = generateChitanta(church, data)
    else if (doc.tip === 'proces_verbal') pdfDoc = generateProcesVerbal(church, data)
    else pdfDoc = generateAdeverinta(church, data)
    pdfDoc.save(`${doc.tip}-${doc.nr}-${doc.data}.pdf`)
  }

  const stampSvg = generateStampilaSVG(church)
  const stampUrl = stampilaSVGtoDataURL(stampSvg)

  return (
    <div>
      <h2 className="section-title">Documente</h2>

      <div className="toggle-pill" style={{ marginBottom: 20 }}>
        <button className={subTab === 'genereaza' ? 'active' : ''} onClick={() => setSubTab('genereaza')}>
          Genereaza
        </button>
        <button className={subTab === 'istoric' ? 'active' : ''} onClick={() => setSubTab('istoric')}>
          Istoric
        </button>
      </div>

      {subTab === 'genereaza' && (
        <div className="fade-in">
          {/* Stampila preview + accept */}
          {!stampAccepted && (
            <div className="card" style={{ marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Preview Stampila Auto-Generata</div>
              <img
                src={stampUrl}
                alt="Stampila"
                style={{ maxWidth: 320, width: '100%', height: 'auto', margin: '0 auto 16px', display: 'block' }}
              />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Aceasta stampila va aparea pe documentele PDF generate. O poti schimba ulterior din Setari.
              </p>
              <button className="btn btn-gold" onClick={handleAcceptStamp}>
                Accepta stampila si continua
              </button>
            </div>
          )}

          {stampAccepted && (
            <>
              {success && (
                <div style={{
                  background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.3)',
                  color: 'var(--success)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14
                }}>
                  {success}
                </div>
              )}

              {/* Tip selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {TIPURI.map(t => (
                  <button
                    key={t.id}
                    className={`btn btn-sm ${tip === t.id ? 'btn-gold' : 'btn-ghost'}`}
                    onClick={() => setTip(t.id)}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <form className="card fade-in" onSubmit={handleGenerate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Numar document *</label>
                    <input value={form.nr} onChange={set('nr')} placeholder="001" required />
                  </div>
                  <div className="form-group">
                    <label>Data *</label>
                    <input type="date" value={form.data} onChange={set('data')} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Persoana *</label>
                  <input value={form.persoana} onChange={set('persoana')} placeholder="Nume Prenume" required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Suma *</label>
                    <input type="number" step="0.01" min="0.01" value={form.suma} onChange={set('suma')} placeholder="0.00" required />
                  </div>
                  <div className="form-group">
                    <label>Moneda</label>
                    <select value={form.moneda} onChange={set('moneda')}>
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Detalii / Destinatie *</label>
                  <textarea rows={3} value={form.detalii} onChange={set('detalii')} placeholder="Destinatia sumei..." required />
                </div>

                <button
                  type="submit"
                  className="btn btn-gold"
                  style={{ width: '100%', justifyContent: 'center', padding: 13 }}
                  disabled={generating}
                >
                  {generating ? 'Se genereaza...' : `Genereaza & Descarca PDF`}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {subTab === 'istoric' && (
        <div className="fade-in">
          {loadingDocs ? (
            <div className="empty-state"><p>Se incarca...</p></div>
          ) : docs.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📄</div>
              <p>Niciun document generat inca</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {docs.map(doc => (
                <div key={doc.id} className="card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>
                    {TIPURI.find(t => t.id === doc.tip)?.icon || '📄'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {TIPURI.find(t => t.id === doc.tip)?.label || doc.tip} nr. {doc.nr}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {doc.data} · {doc.persoana} · {doc.suma} {doc.moneda}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => handleRedownload(doc)}
                    title="Re-descarca"
                  >
                    ↓
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
