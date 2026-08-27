import { Link } from 'react-router-dom'
import HealthBadge from './HealthBadge.jsx'
import { FolderGit2, Users } from 'lucide-react'

export default function ProjectCard({ project, showTeams }) {
  const progress = project.progressPercent ?? 0

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-6 flex flex-col justify-between hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/50 transition-all duration-200"
    >
      <div>
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-200/60">
              <FolderGit2 size={16} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
              {project.name}
            </h3>
          </div>
          <HealthBadge status={project.health} />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-4">
          <span className="font-semibold">{project.methodology}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Users size={13} className="text-slate-400" />
            {project.teamSize ?? 0} members
          </span>
        </p>

        {project.techStack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.techStack.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {showTeams && project.assignedTeams?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.assignedTeams.map((t) => (
              <span
                key={t.id}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60"
              >
                Team: {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Progress</span>
          <span className="font-bold text-slate-900 dark:text-white">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </Link>
  )
}