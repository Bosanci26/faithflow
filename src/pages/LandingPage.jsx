import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import './LandingPage.css'

const BENEFITS = [
  { icon: '💱', title: 'Multi-moneda', desc: 'Gestioneaza RON, EUR, GBP si USD cu conversie automata in timp real.' },
  { icon: '📄', title: 'Documente PDF cu stampila', desc: 'Genereaza chitante, procese verbale si adeverinte cu stampila bisericii.' },
  { icon: '🔒', title: 'Date 100% sigure', desc: 'Date criptate, accesibile doar membrilor autorizati ai bisericii tale.' },
  { icon: '📱', title: 'Accesibil oriunde', desc: 'Functioneaza pe orice dispozitiv — telefon, tableta sau calculator.' },
  { icon: '📊', title: 'Rapoarte detaliate', desc: 'Rapoarte lunare, trimestriale si anuale exportabile ca PDF.' },
  { icon: '🤝', title: 'Suport dedicat', desc: 'Echipa dedicata gata sa te ajute cu orice intrebare sau problema.' }
]

const PLANS = [
  {
    name: 'Gratuit',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ['10 tranzactii/luna', '0 PDF-uri', '1 utilizator', 'Sold multi-moneda', 'Rapoarte de baza'],
    cta: 'Incepe Trial 7 Zile',
    ctaTo: '/register',
    popular: false
  },
  {
    name: 'Standard',
    monthlyPrice: 20,
    annualPrice: 216,
    annualSaving: 24,
    features: ['Tranzactii nelimitate', '15 PDF-uri/luna', '3 utilizatori', 'Multi-moneda complet', 'Rapoarte lunare & trimestriale', 'Stampila personalizata', 'Export date'],
    cta: 'Alege Standard',
    ctaTo: '/register',
    popular: true
  },
  {
    name: 'Premium',
    monthlyPrice: 40,
    annualPrice: 432,
    annualSaving: 48,
    features: ['Tot ce e in Standard +', 'PDF-uri nelimitate', 'Utilizatori nelimitati', 'Mai multe biserici', 'Rapoarte avansate & anuale', 'Suport prioritar', 'Domeniu personalizat', 'Backup automat'],
    cta: 'Alege Premium',
    ctaTo: '/register',
    popular: false
  }
]

export default function LandingPage() {
  const { dark, toggle } = useTheme()
  const [annual, setAnnual] = useState(false)

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">FaithFlow</span>
          </div>
          <div className="nav-links">
            <button onClick={toggle} className="theme-btn" title="Schimba tema">
              {dark ? '☀️' : '🌙'}
            </button>
            <Link to="/login" className="btn btn-ghost btn-sm">Autentificare</Link>
            <Link to="/register" className="btn btn-gold btn-sm">Inregistrare</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero fade-in">
        <div className="hero-badge">
          <span className="dot-live"></span>
          7 zile gratuit · fara card
        </div>
        <h1 className="hero-title">
          Finantele bisericii tale,<br />
          <span className="gold">intr-un singur loc</span>
        </h1>
        <p className="hero-sub">
          Platforma completa de gestiune financiara pentru biserici. Multi-moneda,
          documente PDF cu stampila, rapoarte detaliate si mult mai mult.
        </p>
        <div className="hero-ctas">
          <Link to="/register" className="btn btn-gold">Incepe gratuit →</Link>
          <Link to="/login" className="btn btn-outline">Am deja cont</Link>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="benefits-section">
        <h2 className="section-center-title">De ce <span className="gold">FaithFlow</span>?</h2>
        <div className="benefits-grid">
          {BENEFITS.map((b, i) => (
            <div className="benefit-card fade-in" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="benefit-icon">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANS */}
      <section className="plans-section">
        <h2 className="section-center-title">Planuri <span className="gold">simple si transparente</span></h2>
        <div className="billing-toggle">
          <button className={!annual ? 'active' : ''} onClick={() => setAnnual(false)}>Lunar</button>
          <button className={annual ? 'active' : ''} onClick={() => setAnnual(true)}>
            Anual <span className="discount-tag">-10%</span>
          </button>
        </div>
        <div className="plans-grid">
          {PLANS.map((plan, i) => (
            <div className={`plan-card ${plan.popular ? 'popular' : ''}`} key={i}>
              {plan.popular && <div className="popular-badge">Popular</div>}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                {plan.monthlyPrice === 0 ? (
                  <span className="price-num">Gratuit</span>
                ) : (
                  <>
                    <span className="price-num">
                      €{annual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice}
                    </span>
                    <span className="price-per">/luna</span>
                  </>
                )}
              </div>
              {annual && plan.annualSaving && (
                <div className="annual-saving">Economisesti €{plan.annualSaving}/an</div>
              )}
              <ul className="plan-features">
                {plan.features.map((f, j) => (
                  <li key={j}><span className="check">✓</span> {f}</li>
                ))}
              </ul>
              <Link to={plan.ctaTo} className={`btn ${plan.popular ? 'btn-gold' : 'btn-outline'} plan-cta`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="payment-note">
          🔒 Plata securizata cu card prin Stripe (disponibil in curand)
        </p>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <span className="logo-icon">✦</span> FaithFlow
        </div>
        <p className="footer-copy">© 2026 FaithFlow — Church Financial Management</p>
        <div className="footer-links">
          <Link to="/login">Autentificare</Link>
          <Link to="/register">Inregistrare</Link>
        </div>
      </footer>
    </div>
  )
}
