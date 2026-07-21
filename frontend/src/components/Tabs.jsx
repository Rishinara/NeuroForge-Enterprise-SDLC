export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="wk-tabs">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`wk-tab ${active === t.key ? 'wk-tab-active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}