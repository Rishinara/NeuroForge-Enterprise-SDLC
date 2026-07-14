import './auth.css'

const ROLE_LEDGER = [
  { n: '01', label: 'Super Admin', scope: 'Platform' },
  { n: '02', label: 'Org Admin', scope: 'Organization' },
  { n: '03', label: 'Project Manager', scope: 'Member' },
  { n: '04', label: 'Developer', scope: 'Member' },
  { n: '05', label: 'QA / Tester', scope: 'Member' },
  { n: '06', label: 'Client / Stakeholder', scope: 'Viewer' },
]

export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="nf-shell">
      <aside className="nf-brand-panel">
        <div className="nf-seam" aria-hidden="true" />
        <div className="nf-brand-content">
          <div className="nf-wordmark">
            <span className="nf-wordmark-dot" />
            NeuroForge
          </div>
          <h2 className="nf-brand-headline">
            One build.
            <br />
            Six vantage points.
          </h2>
          <p className="nf-brand-copy">
            Every login sees exactly the surface their role needs — nothing borrowed,
            nothing hidden.
          </p>

          <ol className="nf-role-ledger">
            {ROLE_LEDGER.map((r) => (
              <li key={r.n} className="nf-role-row">
                <span className="nf-role-n">{r.n}</span>
                <span className="nf-role-label">{r.label}</span>
                <span className="nf-role-scope">{r.scope}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <main className="nf-form-panel">
        <div className="nf-form-card">
          {eyebrow && <p className="nf-eyebrow">{eyebrow}</p>}
          {title && <h1 className="nf-title">{title}</h1>}
          {subtitle && <p className="nf-subtitle">{subtitle}</p>}
          {children}
          {footer && <div className="nf-form-footer">{footer}</div>}
        </div>
      </main>
    </div>
  )
}