import { Sparkles, Kanban, ShieldCheck, Workflow } from 'lucide-react'
import './auth.css'

const SDLC_PILLARS = [
  {
    icon: Sparkles,
    title: 'AI Specification Engine',
    desc: 'Generate, review, and validate architectural specs with neural precision.',
    tag: 'AI Powered',
    color: 'ember',
  },
  {
    icon: Kanban,
    title: 'Adaptive Agile & Kanban',
    desc: 'Real-time velocity analytics, blocker triage, and sprint tracking.',
    tag: 'Live Sync',
    color: 'indigo',
  },
  {
    icon: ShieldCheck,
    title: 'Continuous Quality & QA',
    desc: 'Integrated test matrices, automated bug lifecycle, and release gates.',
    tag: 'Zero Defects',
    color: 'teal',
  },
  {
    icon: Workflow,
    title: 'Enterprise RBAC & Delivery',
    desc: 'Multi-tenant workspaces with role-governed compliance & audit trails.',
    tag: 'Governance',
    color: 'blue',
  },
]

export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="nf-shell">
      <aside className="nf-brand-panel">
        <div className="nf-seam" aria-hidden="true" />
        <div className="nf-ambient-glow" aria-hidden="true" />
        <div className="nf-ambient-orb-1" aria-hidden="true" />
        <div className="nf-ambient-orb-2" aria-hidden="true" />

        <div className="nf-brand-content">
          <div className="nf-brand-topbar">
            <div className="nf-wordmark">
              <span className="nf-wordmark-pulse-ring">
                <span className="nf-wordmark-dot" />
              </span>
              NeuroForge
            </div>
            <span className="nf-status-badge">
              <span className="nf-status-radar" />
              <span className="nf-status-text">SDLC v2.4 Live</span>
            </span>
          </div>

          <h2 className="nf-brand-headline">
            Architect, build & ship with neural velocity.
          </h2>
          <p className="nf-brand-copy">
            The unified enterprise SDLC engine connecting requirements, sprint orchestration,
            automated QA, and multi-tenant governance.
          </p>

          <div className="nf-features-list">
            {SDLC_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon
              return (
                <div
                  key={pillar.title}
                  className="nf-feature-card"
                  style={{ animationDelay: `${0.1 + idx * 0.12}s` }}
                >
                  <div className={`nf-feature-icon-wrapper nf-icon-${pillar.color}`}>
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <div className="nf-feature-details">
                    <div className="nf-feature-header">
                      <h4 className="nf-feature-title">{pillar.title}</h4>
                      <span className="nf-feature-tag">{pillar.tag}</span>
                    </div>
                    <p className="nf-feature-desc">{pillar.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="nf-metrics-ribbon">
            <div className="nf-metric-item">
              <span className="nf-metric-val">4.8x</span>
              <span className="nf-metric-lbl">Sprint Velocity</span>
            </div>
            <div className="nf-metric-divider" />
            <div className="nf-metric-item">
              <span className="nf-metric-val">99.9%</span>
              <span className="nf-metric-lbl">Release SLA</span>
            </div>
            <div className="nf-metric-divider" />
            <div className="nf-metric-item">
              <span className="nf-metric-val">Zero</span>
              <span className="nf-metric-lbl">Blindspots</span>
            </div>
          </div>
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