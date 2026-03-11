import { useState, useRef } from 'react'
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

const TABS = [
  { id: 'acasa', label: 'Acasa', icon: '🏠' },
  { id: 'adauga', label: 'Adauga', icon: '➕' },
  { id: 'tranzactii', label: 'Tranzactii', icon: '📋' },
  { id: 'conturi', label: 'Conturi', icon: '💰' },
  { id: 'rapoarte', label: 'Rapoarte', icon: '📊' },
  { id: 'documente', label: 'Documente', icon: '📄' },
  { id: 'admin', label: 'Admin', icon: '⚙️' }
]

export default function DashboardLayout() {
  const { user, signOut, isSuperAdmin } = useAuth()
  const { dark, toggle } = useTheme()
  const { currentChurch, userRole, allChurches, loading, switchChurch, refreshChurch } = useTenant()
  const [activeTab, setActiveTab] = useState('acasa')
  const [superAdminMode, setSuperAdminMode] = useState(false)
  const touchStartX = useRef(null)

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

  if (loading) return (
    <div className="dash-loading">
      <span className="gold">✦</span> Se incarca...
    </div>
  )

  if (!currentChurch) return (
    <div className="dash-loading">
      <span className="gold">✦</span> Nu ai o biserica asociata. Contacteaza administratorul.
    </div>
  )

  const renderTab = () => {
    const props = { church: currentChurch, userRole, refreshChurch }
    switch (activeTab) {
      case 'acasa': return <AcasaTab {...props} onNavigate={setActiveTab} />
      case 'adauga': return <AdaugaTab {...props} />
      case 'tranzactii': return <TranzactiiTab {...props} />
      case 'conturi': return <ConturiTab {...props} />
      case 'rapoarte': return <RapoarteTab {...props} />
      case 'documente': return <DocumenteTab {...props} />
      case 'admin': return <AdminTab {...props} allChurches={allChurches} switchChurch={switchChurch} />
      default: return null
    }
  }

  return (
    <div className="dash-root" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
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
          <span className="badge badge-live"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span> LIVE</span>
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
      <main className="dash-content fade-in">
        {renderTab()}
      </main>

      {/* BOTTOM NAV */}
      <nav className="dash-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
