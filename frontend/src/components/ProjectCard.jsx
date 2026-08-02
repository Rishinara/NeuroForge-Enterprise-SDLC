import { Link } from 'react-router-dom'
import HealthBadge from './HealthBadge.jsx'
import './project-card.css'

export default function ProjectCard({ project, showTeams }) {
  const progress = project.progressPercent ?? 0

  return (
    <Link to={`/projects/${project.id}`} className="pc-card">
      <div className="pc-top">
        <h3 className="pc-name">{project.name}</h3>
        <HealthBadge status={project.health} />
      </div>

      <p className="pc-meta">{project.methodology} · {project.teamSize ?? 0} members</p>

      {project.techStack?.length > 0 && (
        <div className="pc-tags">
          {project.techStack.slice(0, 4).map((tag) => (
            <span key={tag} className="pc-tag">{tag}</span>
          ))}
        </div>
      )}

      {showTeams && project.assignedTeams?.length > 0 && (
        <div className="pc-tags" style={{ marginTop: 8 }}>
          {project.assignedTeams.map((t) => (
            <span key={t.id} className="pc-tag" style={{ background: '#e2e8f0', color: '#334155' }}>
              Team: {t.name}
            </span>
          ))}
        </div>
      )}

      <div className="pc-progress-track">
        <div className="pc-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="pc-progress-label">{progress}% complete</p>
    </Link>
  )
}