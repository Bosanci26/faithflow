import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { generateStampilaSVG, stampilaSVGtoDataURL } from '../../lib/stampila'
import { DENOMINATIUNI, VENITURI_CATEGORII, CHELTUIELI_CATEGORII } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminTab({ church, userRole, refreshChurch }) {
  const { user } = useAuth()
  const [subTab, setSubTab] = useState('setari')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [info, setInfo] = useState({
    name: church.name || '',
    denomination: church.denomination || '',
    city: church.city || '',
    county: church.county || '',
    email: church.email || '',
    pastor_name: church.pastor_name || '',
    casier_name: church.casier_name || ''
  })

  // Categorii custom
  const [customVen, setCustomVen] = useState(church.custom_categories_venituri || [])
  const [customChel, setCustomChel] = useState(church.custom_categories_cheltuieli || [])
  const [newVenCat, setNewVenCat] = useState('')
  const [newChelCat, setNewChelCat] = useState('')

  // Utilizatori
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [inviting, setInviting] = useState(false)

  // Stampila
  const [stampPreview, setStampPreview] = useState(null)
  const fileRef = useRef()

  const stampSvg = generateStampilaSVG(church)
  const stampUrl = stampilaSVGtoDataURL(stampSvg)

  const canEdit = userRole === 'owner' || userRole === 'admin'

  const handleSaveInfo = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('churches').update({
      name: info.name,
      denomination: info.denomination,
      city: info.city,
      county: info.county,
      email: info.email,
      pastor_name: info.pastor_name,
      casier_name: info.casier_name
    }).eq('id', church.id)
    await refreshChurch()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleAddVenCat = async () => {
    if (!newVenCat.trim()) return
    const updated = [...customVen, newVenCat.trim()]
    setCustomVen(updated)
    setNewVenCat('')
    await supabase.from('churches').update({ custom_categories_venituri: updated }).eq('id', church.id)
    await refreshChurch()
  }

  const handleRemoveVenCat = async (cat) => {
    const updated = customVen.filter(c => c !== cat)
    setCustomVen(updated)
    await supabase.from('churches').update({ custom_categories_venituri: updated }).eq('id', church.id)
    await refreshChurch()
  }

  const handleAddChelCat = async () => {
    if (!newChelCat.trim()) return
    const updated = [...customChel, newChelCat.trim()]
    setCustomChel(updated)
    setNewChelCat('')
    await supabase.from('churches').update({ custom_categories_cheltuieli: updated }).eq('id', church.id)
    await refreshChurch()
  }

  const handleRemoveChelCat = async (cat) => {
    const updated = customChel.filter(c => c !== cat)
    setCustomChel(updated)
    await supabase.from('churches').update({ custom_categories_cheltuieli: updated }).eq('id', church.id)
    await refreshChurch()
  }

  const loadMembers = async () => {
    setLoadingMembers(true)
    const { data } = await supabase
      .from('church_members')
      .select('*, profiles:user_id(email, full_name)')
      .eq('church_id', church.id)
    setMembers(data || [])
    setLoadingMembers(false)
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviting(true)
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('church_invitations').insert({
      church_id: church.id,
      email: inviteEmail,
      role: inviteRole,
      token,
      expires_at: expiresAt
    })
    alert(`Invitatia a fost trimisa la ${inviteEmail} (implementare email in curand)`)
    setInviteEmail('')
    setInviting(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setStampPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleUploadStamp = async () => {
    if (!stampPreview) return
    setSaving(true)
    const filename = `stamps/${church.id}-${Date.now()}.png`
    const base64 = stampPreview.split(',')[1]
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const { data: upData } = await supabase.storage
      .from('church-assets')
      .upload(filename, bytes, { contentType: 'image/png', upsert: true })
    if (upData) {
      const { data: urlData } = supabase.storage.from('church-assets').getPublicUrl(filename)
      await supabase.from('churches').update({ stamp_url: urlData.publicUrl }).eq('id', church.id)
      await refreshChurch()
    }
    setSaving(false)
    setStampPreview(null)
    alert('Stampila a fost actualizata!')
  }

  const handleResetStamp = async () => {
    if (!confirm('Resetezi stampila la cea auto-generata?')) return
    await supabase.from('churches').update({ stamp_url: null }).eq('id', church.id)
    await refreshChurch()
    localStorage.removeItem(`stamp-accepted-${church.id}`)
    setStampPreview(null)
    alert('Stampila a fost resetata.')
  }

  return (
    <div>
      <h2 className="section-title">Administrare</h2>

      <div className="toggle-pill" style={{ marginBottom: 20 }}>
        <button className={subTab === 'setari' ? 'active' : ''} onClick={() => setSubTab('setari')}>
          Setari
        </button>
        <button className={subTab === 'categorii' ? 'active' : ''} onClick={() => setSubTab('categorii')}>
          Categorii
        </button>
        <button
          className={subTab === 'utilizatori' ? 'active' : ''}
          onClick={() => { setSubTab('utilizatori'); loadMembers() }}
        >
          Utilizatori
        </button>
      </div>

      {subTab === 'setari' && (
        <div className="fade-in">
          {saved && (
            <div style={{
              background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.3)',
              color: 'var(--success)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14
            }}>
              Setarile au fost salvate!
            </div>
          )}

          <form className="card" onSubmit={handleSaveInfo} style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Informatii biserica</div>
            <div className="form-group">
              <label>Numele Bisericii</label>
              <input value={info.name} onChange={e => setInfo(i => ({ ...i, name: e.target.value }))} disabled={!canEdit} />
            </div>
            <div className="form-group">
              <label>Denominatiune</label>
              <select value={info.denomination} onChange={e => setInfo(i => ({ ...i, denomination: e.target.value }))} disabled={!canEdit}>
                {DENOMINATIUNI.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Oras</label>
                <input value={info.city} onChange={e => setInfo(i => ({ ...i, city: e.target.value }))} disabled={!canEdit} />
              </div>
              <div className="form-group">
                <label>Judet</label>
                <input value={info.county} onChange={e => setInfo(i => ({ ...i, county: e.target.value }))} disabled={!canEdit} />
              </div>
            </div>
            <div className="form-group">
              <label>Email de contact</label>
              <input type="email" value={info.email} onChange={e => setInfo(i => ({ ...i, email: e.target.value }))} disabled={!canEdit} />
            </div>

            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 16 }}>Conducere</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Numele Pastorului</label>
                <input value={info.pastor_name} onChange={e => setInfo(i => ({ ...i, pastor_name: e.target.value }))} disabled={!canEdit} placeholder="Prenume Nume" />
              </div>
              <div className="form-group">
                <label>Numele Casierului</label>
                <input value={info.casier_name} onChange={e => setInfo(i => ({ ...i, casier_name: e.target.value }))} disabled={!canEdit} placeholder="Prenume Nume" />
              </div>
            </div>

            {canEdit && (
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? 'Se salveaza...' : 'Salveaza setarile'}
              </button>
            )}
          </form>

          {/* Stampila section */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Stampila</div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img
                src={church.stamp_url || stampPreview || stampUrl}
                alt="Stampila curenta"
                style={{ maxWidth: 300, width: '100%', height: 'auto', margin: '0 auto', display: 'block', borderRadius: 8 }}
              />
              {church.stamp_url && (
                <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 8 }}>Stampila personalizata activa</div>
              )}
              {!church.stamp_url && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Stampila auto-generata</div>
              )}
            </div>

            {canEdit && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/png,image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                  Incarca stampila (PNG/SVG)
                </button>
                {stampPreview && (
                  <button className="btn btn-gold btn-sm" onClick={handleUploadStamp} disabled={saving}>
                    {saving ? 'Se incarca...' : 'Salveaza stampila'}
                  </button>
                )}
                {church.stamp_url && (
                  <button className="btn btn-danger btn-sm" onClick={handleResetStamp}>
                    Reseteaza la auto
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'categorii' && (
        <div className="fade-in">
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Categorii Venituri</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {VENITURI_CATEGORII.map(c => (
                <span key={c} style={{
                  background: 'rgba(76,175,125,0.12)', color: 'var(--success)',
                  borderRadius: 6, padding: '4px 10px', fontSize: 13
                }}>{c}</span>
              ))}
              {customVen.map(c => (
                <span key={c} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(212,168,67,0.12)', color: 'var(--gold)',
                  borderRadius: 6, padding: '4px 10px', fontSize: 13
                }}>
                  {c}
                  {canEdit && (
                    <button onClick={() => handleRemoveVenCat(c)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--danger)', fontSize: 14, lineHeight: 1, padding: 0
                    }}>×</button>
                  )}
                </span>
              ))}
            </div>
            {canEdit && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newVenCat}
                  onChange={e => setNewVenCat(e.target.value)}
                  placeholder="Categorie noua..."
                  style={{ flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddVenCat())}
                />
                <button className="btn btn-gold btn-sm" onClick={handleAddVenCat}>+ Adauga</button>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Categorii Cheltuieli</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {CHELTUIELI_CATEGORII.map(c => (
                <span key={c} style={{
                  background: 'rgba(224,82,82,0.12)', color: 'var(--danger)',
                  borderRadius: 6, padding: '4px 10px', fontSize: 13
                }}>{c}</span>
              ))}
              {customChel.map(c => (
                <span key={c} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(212,168,67,0.12)', color: 'var(--gold)',
                  borderRadius: 6, padding: '4px 10px', fontSize: 13
                }}>
                  {c}
                  {canEdit && (
                    <button onClick={() => handleRemoveChelCat(c)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--danger)', fontSize: 14, lineHeight: 1, padding: 0
                    }}>×</button>
                  )}
                </span>
              ))}
            </div>
            {canEdit && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newChelCat}
                  onChange={e => setNewChelCat(e.target.value)}
                  placeholder="Categorie noua..."
                  style={{ flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddChelCat())}
                />
                <button className="btn btn-gold btn-sm" onClick={handleAddChelCat}>+ Adauga</button>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'utilizatori' && (
        <div className="fade-in">
          {canEdit && (
            <form className="card" onSubmit={handleInvite} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Invita un membru</div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@exemplu.ro"
                  required
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Vizualizator</option>
                </select>
              </div>
              <button type="submit" className="btn btn-gold btn-sm" disabled={inviting}>
                {inviting ? 'Se trimite...' : 'Trimite invitatie'}
              </button>
            </form>
          )}

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Membri activi</div>
            {loadingMembers ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Se incarca...</div>
            ) : members.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Niciun membru gasit.</div>
            ) : members.map((m) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--border)'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(212,168,67,0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--gold)', fontWeight: 700, fontSize: 14
                }}>
                  {(m.profiles?.full_name || m.profiles?.email || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {m.profiles?.full_name || m.profiles?.email || 'Utilizator'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {m.profiles?.email || ''}
                  </div>
                </div>
                <span className="badge badge-gold" style={{ textTransform: 'capitalize' }}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
