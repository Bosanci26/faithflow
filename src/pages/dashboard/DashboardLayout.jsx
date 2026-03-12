import { useState, useRef, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useTenant } from '../../hooks/useTenant'
import { SUPER_ADMIN_EMAIL } from '../../lib/constants'
import AcasaTab from './AcasaTab'
import AdaugaTab from './AdaugaTab'
import TranzactiiTab from './TranzactiiTab'
import ConturiTab from './ConturiTab'
import RapoarteTab from './RapoarteTab'
import DocumenteTab from './DocumenteTab'
import AdminTab from './AdminTab'
import './DashboardLayout.css'

const Icons = {
  acasa: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10L12 3l9 7v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>
      <polyline points="9,21 9,13 15,13 15,21"/>
    </svg>
  ),
  adauga: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  tranzactii: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="6" x2="20" y2="6"/>
      <line x1="9" y1="12" x2="20" y2="12"/>
      <line x1="9" y1="18" x2="20" y2="18"/>
      <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  conturi: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
    </svg>
  ),
  rapoarte: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  documente: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  admin: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

const TABS = [
  { id: 'acasa', label: 'Acasa', icon: Icons.acasa },
  { id: 'adauga', label: 'Adauga', icon: Icons.adauga },
  { id: 'tranzactii', label: 'Tranzactii', icon: Icons.tranzactii },
  { id: 'conturi', label: 'Conturi', icon: Icons.conturi },
  { id: 'rapoarte', label: 'Rapoarte', icon: Icons.rapoarte },
  { id: 'documente', label: 'Documente', icon: Icons.documente },
  { id: 'admin', label: 'Admin', icon: Icons.admin }
]

export default function DashboardLayout() {
  const { user, signOut, isSuperAdmin } = useAuth()
  const { dark, toggle } = useTheme()
  const { currentChurch, userRole, allChurches, loading, switchChurch, refreshChurch } = useTenant()
  const [activeTab, setActiveTab] = useState('acasa')
  const [docTip, setDocTip] = useState(null)
  const [superAdminMode, setSuperAdminMode] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const touchStartX = useRef(null)

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 70 && activeTab !== 'acasa') {
      const idx = TABS.findIndex(t => t.id === activeTab)
      if (idx > 0) setActiveTab(TABS[idx - 1].id)
    }
    touchStartX.current = null
  }

  // Navigate from AcasaTab actions (tab + optional doc tip)
  const handleNavigate = (tab, tip = null) => {
    setActiveTab(tab)
    if (tip) setDocTip(tip)
    else setDocTip(null)
  }

  if (loading) return (
    <div className="dash-loading">
      <span className="gold">✦</span> Se incarca...
    </div>
  )

  if (!currentChurch) return <Navigate to="/setup" replace />

  const renderTab = () => {
    const props = { church: currentChurch, userRole, refreshChurch }
    switch (activeTab) {
      case 'acasa': return <AcasaTab {...props} onNavigate={handleNavigate} />
      case 'adauga': return <AdaugaTab {...props} />
      case 'tranzactii': return <TranzactiiTab {...props} />
      case 'conturi': return <ConturiTab {...props} />
      case 'rapoarte': return <RapoarteTab {...props} />
      case 'documente': return <DocumenteTab {...props} initialTip={docTip} />
      case 'admin': return <AdminTab {...props} allChurches={allChurches} switchChurch={switchChurch} />
      default: return null
    }
  }

  return (
    <div className="dash-root">
      {/* HEADER */}
      <header className="dash-header">
        <div className="dash-header-left">
          {activeTab !== 'acasa' && (
            <button className="back-btn" onClick={() => setActiveTab('acasa')} title="Inapoi">
              ←
            </button>
          )}
          <div className="church-info">
            {currentChurch.logo_url
              ? <img src={currentChurch.logo_url} alt="logo" className="church-logo" />
              : <span className="church-logo-placeholder">✦</span>
            }
            <div>
              <div className="church-name">{currentChurch.name}</div>
              <div className="church-location">{currentChurch.city}, {currentChurch.county}</div>
            </div>
          </div>
          {isOnline
            ? <span className="badge badge-live"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span> LIVE</span>
            : <span className="badge" style={{ background: 'rgba(224,82,82,0.15)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>📵 Offline</span>
          }
        </div>

        <div className="dash-header-right">
          <button onClick={toggle} className="theme-btn">{dark ? '☀️' : '🌙'}</button>
          {isSuperAdmin && (
            <button
              className={`btn btn-sm ${superAdminMode ? 'btn-gold' : 'btn-ghost'}`}
              onClick={() => setSuperAdminMode(m => !m)}
              title="Super Admin Mode"
            >
              SA
            </button>
          )}
          <div className="user-info">
            <div className="user-name">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</div>
            <div className="user-role">{userRole === 'owner' ? 'Administrator' : userRole}</div>
          </div>
          {isSuperAdmin && superAdminMode && allChurches.length > 1 && (
            <select
              className="church-switcher"
              value={currentChurch.id}
              onChange={e => switchChurch(e.target.value)}
            >
              {allChurches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button onClick={signOut} className="btn btn-ghost btn-sm">Iesire</button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="dash-content fade-in" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {renderTab()}
      </main>

      {/* BOTTOM NAV */}
      <nav className="dash-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setDocTip(null) }}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
