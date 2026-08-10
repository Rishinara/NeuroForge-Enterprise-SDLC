// Real team-member directory. Replace this with a fetch to a real backend
// (see src/services/teamService.js) once your org/user system is wired up —
// the shape below (name, skills, activeTickets) is exactly what that service
// should return so nothing else in the app needs to change.
export const teamMembers = [
  { id: 'u1', name: 'Rahul Sharma', skills: ['Backend', 'Security'], activeTickets: 3 },
  { id: 'u2', name: 'Emily Zhang', skills: ['Frontend', 'QA'], activeTickets: 4 },
  { id: 'u3', name: 'Ananya Iyer', skills: ['QA', 'Frontend'], activeTickets: 2 },
  { id: 'u4', name: 'Michael Chen', skills: ['Database', 'Backend'], activeTickets: 5 },
  { id: 'u5', name: 'Priya Nair', skills: ['DevOps', 'Backend'], activeTickets: 2 },
  { id: 'u6', name: 'David Okafor', skills: ['DevOps', 'Database'], activeTickets: 3 },
  { id: 'u7', name: 'Sofia Rossi', skills: ['Mobile', 'Database'], activeTickets: 4 },
  { id: 'u8', name: 'Arjun Mehta', skills: ['Mobile', 'Security'], activeTickets: 1 },
];

/**
 * Picks the best assignee for a category: prefers someone whose skills match
 * the ticket's category, then breaks ties (or falls back, if nobody matches)
 * by choosing whoever currently has the lightest workload.
 */
export function pickAssignee(category) {
  const candidates = teamMembers.filter((m) => m.skills.includes(category));
  const pool = candidates.length ? candidates : teamMembers;
  return pool.reduce((lightest, m) => (m.activeTickets < lightest.activeTickets ? m : lightest));
}
