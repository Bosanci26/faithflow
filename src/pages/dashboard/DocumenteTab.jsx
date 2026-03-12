import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CURRENCIES, VENITURI_CATEGORII } from '../../lib/constants'
import { generateChitanta, generateProcesVerbal, generateDonatie } from '../../lib/pdfGenerator'

const today = () => new Date().toISOString().split('T')[0]

const TIPURI = [
  { id: 'chitanta', label: 'Chitanta', icon: '🧾' },
  { id: 'proces_verbal', label: 'Proc. Verbal', icon: '📋' },
  { id: 'donatie', label: 'Donatie', icon: '📝' }
]

const TIP_SERVICIU = [
  'Duminica dimineata',
  'Post si rugaciune',
  'Eveniment special',
  'Cina a Domnului',
  'Altele'
]

const TIP_DONATIE = [
  'Donatie financiara', 'Donatie materiala', 'Ajutor social'
]

export default function DocumenteTab({ church, refreshChurch }) {
  const [subTab, setSubTab] = useState('genereaza')
  const [tip, setTip] = useState('chitanta')
  const [generating, setGenerating] = useState(false)
  const [success, setSuccess] = useState('')
  const [docs, setDocs] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  // Chitanta form
  const [chitantaForm, setChitantaForm] = useState({
    data: today(), donator: '', suma: '', moneda: 'RON',
    categorie: VENITURI_CATEGORII[0], scop: '',
    casier: church?.casier_name || ''
  })

  // Proces Verbal form
  const [pvForm, setPvForm] = useState({
    data: today(), tipServiciu: TIP_SERVICIU[0], suma: '', moneda: 'RON',
    casier: church?.casier_name || '', pastor: church?.pastor_name || '',
    martor1: '', martor2: '', observatii: ''
  })

  // Donatie form
  const [donatieForm, setDonatieForm] = useState({
    data: today(), tipDonatie: TIP_DONATIE[0],
    beneficiar: '', serieCI: '', nrCI: '', adresa: '',
    suma: '', moneda: 'RON',
    casier: church?.casier_name || '', pastor: church?.pastor_name || ''
  })
  const [donatieDirectie, setDonatieDirectie] = useState('primita')

  useEffect(() => {
    if (church) {
      setChitantaForm(f => ({ ...f, casier: church.casier_name || '' }))
      setPvForm(f => ({ ...f, casier: church.casier_name || '', pastor: church.pastor_name || '' }))
      setDonatieForm(f => ({ ...f, casier: church.casier_name || '', pastor: church.pastor_name || '' }))
    }
  }, [church])

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

  const getNextNr = async (field) => {
    const current = church[field] || 0
    const next = current + 1
    await supabase.from('churches').update({ [field]: next }).eq('id', church.id)
    await refreshChurch()
    return next
  }

  const handleGenerate = async (e, doPrint = false) => {
    e.preventDefault()
    setGenerating(true)

    let doc, nr, data, filename

    try {
      if (tip === 'chitanta') {
        if (!chitantaForm.donator || !chitantaForm.suma) { setGenerating(false); return }
        nr = await getNextNr('last_chitanta_nr')
        data = { ...chitantaForm, nr, suma: parseFloat(chitantaForm.suma) }
        doc = generateChitanta(church, data)
        filename = `chitanta-${nr}-${chitantaForm.data}.pdf`

        await supabase.from('documente').insert({
          church_id: church.id, tip: 'chitanta', nr: String(nr),
          data: chitantaForm.data, suma: parseFloat(chitantaForm.suma),
          moneda: chitantaForm.moneda, persoana: chitantaForm.donator,
          detalii: chitantaForm.scop || chitantaForm.categorie
        })
        // Auto-add to venituri
        await supabase.from('venituri').insert({
          church_id: church.id,
          data: chitantaForm.data,
          suma: parseFloat(chitantaForm.suma),
          moneda: chitantaForm.moneda,
          categorie: chitantaForm.categorie,
          descriere: `Chitanta nr. ${nr} - ${chitantaForm.donator}`
        })

      } else if (tip === 'proces_verbal') {
        if (!pvForm.suma) { setGenerating(false); return }
        nr = await getNextNr('last_pv_nr')
        data = { ...pvForm, nr, suma: parseFloat(pvForm.suma) }
        doc = generateProcesVerbal(church, data)
        filename = `pv-${nr}-${pvForm.data}.pdf`

        await supabase.from('documente').insert({
          church_id: church.id, tip: 'proces_verbal', nr: String(nr),
          data: pvForm.data, suma: parseFloat(pvForm.suma),
          moneda: pvForm.moneda, persoana: pvForm.casier,
          detalii: pvForm.tipServiciu
        })

      } else {
        if (!donatieForm.beneficiar || !donatieForm.suma) { setGenerating(false); return }
        nr = await getNextNr('last_donatie_nr')
        data = { ...donatieForm, nr, suma: parseFloat(donatieForm.suma) }
        doc = generateDonatie(church, data)
        filename = `donatie-${nr}-${donatieForm.data}.pdf`

        await supabase.from('documente').insert({
          church_id: church.id, tip: 'donatie', nr: String(nr),
          data: donatieForm.data, suma: parseFloat(donatieForm.suma),
          moneda: donatieForm.moneda, persoana: donatieForm.beneficiar,
          detalii: donatieForm.tipDonatie
        })
        // Auto-add to venituri or cheltuieli
        const ciStr = donatieForm.serieCI && donatieForm.nrCI
          ? ` - CI ${donatieForm.serieCI}/${donatieForm.nrCI}` : ''
        if (donatieDirectie === 'primita') {
          await supabase.from('venituri').insert({
            church_id: church.id,
            data: donatieForm.data,
            suma: parseFloat(donatieForm.suma),
            moneda: donatieForm.moneda,
            categorie: 'Donatie primita',
            descriere: `Donatie primita - ${donatieForm.beneficiar}${ciStr}`
          })
        } else {
          await supabase.from('cheltuieli').insert({
            church_id: church.id,
            data: donatieForm.data,
            suma: parseFloat(donatieForm.suma),
            moneda: donatieForm.moneda,
            categorie: 'Donatie data',
            descriere: `Donatie data - ${donatieForm.beneficiar}${ciStr}`
          })
        }
      }

      if (doPrint) {
        const pdfBlob = doc.output('blob')
        const url = URL.createObjectURL(pdfBlob)
        const win = window.open(url, '_blank')
        if (win) win.addEventListener('load', () => { win.focus(); win.print() })
      } else {
        doc.save(filename)
      }

      setSuccess(`Document nr. ${nr} generat si ${doPrint ? 'trimis la tiparire' : 'descarcat'}!`)
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      console.error(err)
    }
    setGenerating(false)
  }

  const handleRedownload = (d) => {
    const data = {
      nr: d.nr, data: d.data, suma: d.suma, moneda: d.moneda,
      persoana: d.persoana, detalii: d.detalii,
      donator: d.persoana, casier: church.casier_name || '',
      pastor: church.pastor_name || ''
    }
    let pdfDoc
    if (d.tip === 'chitanta') pdfDoc = generateChitanta(church, data)
    else if (d.tip === 'proces_verbal') pdfDoc = generateProcesVerbal(church, { ...data, tipServiciu: d.detalii })
    else pdfDoc = generateDonatie(church, { ...data, beneficiar: d.persoana, tipDonatie: d.detalii })
    pdfDoc.save(`${d.tip}-${d.nr}-${d.data}.pdf`)
  }

  const renderForm = () => {
    if (tip === 'chitanta') {
      const set = k => e => setChitantaForm(f => ({ ...f, [k]: e.target.value }))
      return (
        <form className="card fade-in" onSubmit={e => handleGenerate(e)}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--gold)' }}>Chitanta</div>

          <div className="form-group">
            <label>Data *</label>
            <input type="date" value={chitantaForm.data} onChange={set('data')} required />
          </div>
          <div className="form-group">
            <label>Numele donatorului *</label>
            <input value={chitantaForm.donator} onChange={set('donator')} placeholder="Nume Prenume" required />
          </div>
          <div className="form-group">
            <label>Suma *</label>
            <input type="number" step="0.01" min="0.01" value={chitantaForm.suma} onChange={set('suma')} placeholder="0.00" required />
          </div>
          <div className="form-group">
            <label>Moneda</label>
            <select value={chitantaForm.moneda} onChange={set('moneda')}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Categorie</label>
            <select value={chitantaForm.categorie} onChange={set('categorie')}>
              {VENITURI_CATEGORII.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Scopul donatiei (optional)</label>
            <input value={chitantaForm.scop} onChange={set('scop')} placeholder="ex: Fond constructie" />
          </div>
          <div className="form-group">
            <label>Casier</label>
            <input value={chitantaForm.casier} onChange={set('casier')} placeholder="Nume casier" />
          </div>

          <div className="doc-btn-row">
            <button type="submit" className="btn btn-gold doc-btn-main" disabled={generating}>
              {generating ? 'Se genereaza...' : '⬇ Genereaza PDF'}
            </button>
            <button type="button" className="btn btn-ghost doc-btn-print" disabled={generating}
              onClick={e => handleGenerate(e, true)}>
              🖨 Tipareste
            </button>
          </div>
        </form>
      )
    }

    if (tip === 'proces_verbal') {
      const set = k => e => setPvForm(f => ({ ...f, [k]: e.target.value }))
      return (
        <form className="card fade-in" onSubmit={e => handleGenerate(e)}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--gold)' }}>Proces Verbal Colecta</div>

          <div className="form-group">
            <label>Data *</label>
            <input type="date" value={pvForm.data} onChange={set('data')} required />
          </div>
          <div className="form-group">
            <label>Tipul serviciului</label>
            <select value={pvForm.tipServiciu} onChange={set('tipServiciu')}>
              {TIP_SERVICIU.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Suma colectata *</label>
            <input type="number" step="0.01" min="0.01" value={pvForm.suma} onChange={set('suma')} placeholder="0.00" required />
          </div>
          <div className="form-group">
            <label>Moneda</label>
            <select value={pvForm.moneda} onChange={set('moneda')}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="doc-grid-2">
            <div className="form-group">
              <label>Casier</label>
              <input value={pvForm.casier} onChange={set('casier')} placeholder="Nume casier" />
            </div>
            <div className="form-group">
              <label>Pastor</label>
              <input value={pvForm.pastor} onChange={set('pastor')} placeholder="Nume pastor" />
            </div>
          </div>
          <div className="doc-grid-2">
            <div className="form-group">
              <label>Martor 1</label>
              <input value={pvForm.martor1} onChange={set('martor1')} placeholder="Nume martor" />
            </div>
            <div className="form-group">
              <label>Martor 2</label>
              <input value={pvForm.martor2} onChange={set('martor2')} placeholder="Nume martor" />
            </div>
          </div>
          <div className="form-group">
            <label>Observatii (optional)</label>
            <textarea rows={2} value={pvForm.observatii} onChange={set('observatii')} placeholder="Observatii..." />
          </div>

          <div className="doc-btn-row">
            <button type="submit" className="btn btn-gold doc-btn-main" disabled={generating}>
              {generating ? 'Se genereaza...' : '⬇ Genereaza PDF'}
            </button>
            <button type="button" className="btn btn-ghost doc-btn-print" disabled={generating}
              onClick={e => handleGenerate(e, true)}>
              🖨 Tipareste
            </button>
          </div>
        </form>
      )
    }

    // Donatie
    const set = k => e => setDonatieForm(f => ({ ...f, [k]: e.target.value }))
    return (
      <form className="card fade-in" onSubmit={e => handleGenerate(e)}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--gold)' }}>Adeverinta Donatie</div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ marginBottom: 8 }}>Tipul donatiei</label>
          <div className="toggle-pill">
            <button type="button"
              className={donatieDirectie === 'primita' ? 'active' : ''}
              onClick={() => setDonatieDirectie('primita')}>
              ↓ Primita (venit)
            </button>
            <button type="button"
              className={donatieDirectie === 'data' ? 'active' : ''}
              onClick={() => setDonatieDirectie('data')}>
              ↑ Data (cheltuiala)
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Data *</label>
          <input type="date" value={donatieForm.data} onChange={set('data')} required />
        </div>
        <div className="form-group">
          <label>Tip donatie</label>
          <select value={donatieForm.tipDonatie} onChange={set('tipDonatie')}>
            {TIP_DONATIE.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Numele beneficiarului *</label>
          <input value={donatieForm.beneficiar} onChange={set('beneficiar')} placeholder="Nume Prenume" required />
        </div>
        <div className="doc-grid-2">
          <div className="form-group">
            <label>Serie CI</label>
            <input value={donatieForm.serieCI} onChange={set('serieCI')} placeholder="AB" maxLength={2} style={{ textTransform: 'uppercase' }} />
          </div>
          <div className="form-group">
            <label>Nr. CI</label>
            <input value={donatieForm.nrCI} onChange={set('nrCI')} placeholder="123456" maxLength={6} />
          </div>
        </div>
        <div className="form-group">
          <label>Adresa beneficiarului (optional)</label>
          <input value={donatieForm.adresa} onChange={set('adresa')} placeholder="Str. Exemplu nr. 1, oras" />
        </div>
        <div className="form-group">
          <label>Suma *</label>
          <input type="number" step="0.01" min="0.01" value={donatieForm.suma} onChange={set('suma')} placeholder="0.00" required />
        </div>
        <div className="form-group">
          <label>Moneda</label>
          <select value={donatieForm.moneda} onChange={set('moneda')}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="doc-grid-2">
          <div className="form-group">
            <label>Casier</label>
            <input value={donatieForm.casier} onChange={set('casier')} placeholder="Nume casier" />
          </div>
          <div className="form-group">
            <label>Pastor</label>
            <input value={donatieForm.pastor} onChange={set('pastor')} placeholder="Nume pastor" />
          </div>
        </div>

        <div className="doc-btn-row">
          <button type="submit" className="btn btn-gold doc-btn-main" disabled={generating}>
            {generating ? 'Se genereaza...' : '⬇ Genereaza PDF'}
          </button>
          <button type="button" className="btn btn-ghost doc-btn-print" disabled={generating}
            onClick={e => handleGenerate(e, true)}>
            🖨 Tipareste
          </button>
        </div>
      </form>
    )
  }

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
          {success && (
            <div style={{
              background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.3)',
              color: 'var(--success)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14
            }}>
              {success}
            </div>
          )}

          <div className="doc-type-row" style={{ marginBottom: 16 }}>
            {TIPURI.map(t => (
              <button
                key={t.id}
                className={`btn btn-sm ${tip === t.id ? 'btn-gold' : 'btn-ghost'} doc-type-btn`}
                onClick={() => setTip(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            Nr. auto: Chitanta #{(church.last_chitanta_nr || 0) + 1} · PV #{(church.last_pv_nr || 0) + 1} · Donatie #{(church.last_donatie_nr || 0) + 1}
          </div>

          {renderForm()}
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
              {docs.map(d => (
                <div key={d.id} className="card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>
                    {TIPURI.find(t => t.id === d.tip)?.icon || '📄'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {TIPURI.find(t => t.id === d.tip)?.label || d.tip} nr. {d.nr}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {d.data} · {d.persoana} · {d.suma} {d.moneda}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => handleRedownload(d)}
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
