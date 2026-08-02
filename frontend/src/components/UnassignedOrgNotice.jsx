import { useAuth, ROLES } from '../context/AuthContext.jsx'

export default function UnassignedOrgNotice() {
  const { user, logout } = useAuth()

  if (user?.role === ROLES.SUPER_ADMIN) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        minHeight: '70vh',
        padding: 24,
      }}
    >
      <div
        className="wk-card"
        style={{
          maxWidth: 520,
          width: '100%',
          textAlign: 'center',
          padding: '40px 32px',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            margin: '0 auto 20px auto',
          }}
        >
          ⏳
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Account Created Successfully
        </h2>

        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#475569', marginBottom: 24 }}>
          Your account (<strong>{user?.email}</strong>) has been created successfully.
          <br />
          {user?.role === ROLES.ORG_ADMIN ? (
            <>Please wait until the <strong>Super Admin</strong> assigns you to an organization.</>
          ) : (
            <>Please wait until your <strong>Organization Admin</strong> invites you to an organization.</>
          )}
        </p>

        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #f1f5f9', marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            🔒 Organization features, projects, teams, specs, backlogs, and board items are restricted until an organization assignment is granted.
          </p>
        </div>

        <button
          type="button"
          className="wk-btn wk-btn-secondary"
          style={{ width: 'auto', padding: '10px 24px', fontSize: 14 }}
          onClick={logout}
        >
          Log out
        </button>
      </div>
    </div>
  )
}
