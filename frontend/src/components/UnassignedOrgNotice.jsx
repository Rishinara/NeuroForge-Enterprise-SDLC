import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { Clock, ShieldAlert, LogOut } from 'lucide-react'

export default function UnassignedOrgNotice() {
  const { user, logout } = useAuth()

  if (user?.role === ROLES.SUPER_ADMIN) {
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700 p-8 sm:p-10 max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-6 border border-amber-200/60 shadow-xs">
          <Clock size={32} />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
          Account Under Review
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          Your account (<span className="font-semibold text-slate-900 dark:text-white">{user?.email}</span>) has been created successfully.
          <br className="mb-2" />
          {user?.orgId && user?.orgApproved === false ? (
            <>Your account has been assigned to an organization and is waiting for Organization Admin approval.</>
          ) : user?.role === ROLES.ORG_ADMIN ? (
            <>Please wait until the <strong className="text-slate-900 dark:text-white">Super Admin</strong> assigns you to an organization.</>
          ) : (
            <>Please wait until your <strong className="text-slate-900 dark:text-white">Organization Admin</strong> invites you to an organization.</>
          )}
        </p>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 mb-8 text-left flex items-start gap-3">
          <ShieldAlert size={20} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {user?.orgId && user?.orgApproved === false ? (
              <>Organization features, projects, teams, specs, backlogs, and board items are restricted until your Organization Admin approves your account.</>
            ) : (
              <>Organization features, projects, teams, specs, backlogs, and board items are restricted until an organization assignment is granted.</>
            )}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-600 shadow-xs transition-all active:scale-[0.98]"
          onClick={logout}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )
}
