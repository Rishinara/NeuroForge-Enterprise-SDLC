import { Link } from 'react-router-dom'
import HealthBadge from './HealthBadge.jsx'
import './project-card.css'

export default function ProjectCard({ project }) {
  const milestones = project.milestones || []
  const hasMilestones = milestones.length > 0
  const completedCount = milestones.filter((m) => m.completed).length
  const progress = hasMilestones ? Math.round((completedCount / milestones.length) * 100) : null
  const memberCount = project.members?.length ?? 0

  return (
    <Link to={`/projects/${project.id}`} className="pc-card">
      <div className="pc-top">
        <h3 className="pc-name">{project.name}</h3>
        <HealthBadge status={project.healthStatus} />
      </div>

      <p className="pc-meta">
        {project.methodology === 'AGILE' ? 'Agile' : 'Waterfall'} · {memberCount} member{memberCount === 1 ? '' : 's'}
      </p>

      {project.techStackTags?.length > 0 && (
        <div className="pc-tags">
          {project.techStackTags.slice(0, 4).map((tag) => (
            <span key={tag} className="pc-tag">{tag}</span>
          ))}
        </div>
      )}

      {hasMilestones ? (
        <>
          <div className="pc-progress-track">
            <div className="pc-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="pc-progress-label">{completedCount}/{milestones.length} milestones complete</p>
        </>
      ) : (
        <p className="pc-progress-label">No milestones yet</p>
      )}
    </Link>
  )
}