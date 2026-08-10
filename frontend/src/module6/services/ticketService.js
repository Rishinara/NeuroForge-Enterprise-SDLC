import axios from 'axios';
import { initialTickets } from '../data/tickets.js';
import { pickAssignee } from '../data/teamMembers.js';
import { CATEGORIES } from '../utils/constants.js';

// In a real integration this would point at the backend base URL, e.g.:
// export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });
// It is created here so the axios dependency is wired up and ready for a real backend swap.
export const api = axios.create({ baseURL: '/api' });

const LATENCY = 500;
const FAILURE_RATE = 0; // set > 0 (e.g. 0.05) to simulate random API failures

let db = [...initialTickets];
let nextId = Math.max(...db.map((t) => t.id)) + 1;

function delay(payload, ms = LATENCY) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < FAILURE_RATE) {
        reject(new Error('Network error: request failed'));
      } else {
        resolve(payload);
      }
    }, ms);
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/** Fetch every ticket. Filtering/sorting is done client-side by the caller. */
export function getTickets() {
  return delay(clone(db));
}

/** Fetch a single ticket by id. */
export function getTicketById(id) {
  const ticket = db.find((t) => t.id === Number(id));
  if (!ticket) {
    return Promise.reject(new Error(`Ticket ${id} was not found`));
  }
  return delay(clone(ticket));
}

/**
 * Create a new ticket. Runs a lightweight local "AI" heuristic to generate
 * suggested triage fields, standing in for a real backend inference call.
 */
export function createTicket(payload) {
  const ticket = {
    id: nextId++,
    title: payload.title,
    description: payload.description,
    reporter: payload.reporter,
    attachment: payload.attachment || null,
    createdAt: new Date().toISOString().slice(0, 10),
    status: 'Open',
    ...generateAiSuggestion(payload),
  };
  db = [ticket, ...db];
  return delay(clone(ticket), 900);
}

/** Persist edits to an existing ticket (used by Edit Ticket / Edit Suggestion pages). */
export function updateTicket(id, updates) {
  const index = db.findIndex((t) => t.id === Number(id));
  if (index === -1) {
    return Promise.reject(new Error(`Ticket ${id} was not found`));
  }
  db[index] = { ...db[index], ...updates };
  return delay(clone(db[index]));
}

/** Remove a ticket permanently. */
export function deleteTicket(id) {
  db = db.filter((t) => t.id !== Number(id));
  return delay({ id: Number(id), deleted: true });
}

/** Manager accepts the AI suggestion as-is, moving the ticket to Assigned. */
export function acceptSuggestion(id) {
  return updateTicket(id, { status: 'Assigned' });
}

// --- Local mock "AI" heuristic -------------------------------------------------

function generateAiSuggestion(payload) {
  const text = `${payload.title} ${payload.description}`.toLowerCase();
  const wordCount = payload.description.trim().split(/\s+/).filter(Boolean).length;

  const categoryKeywordMatched = CATEGORIES.some((cat) => text.includes(cat.toLowerCase()));
  const categoryMatch =
    CATEGORIES.find((cat) => text.includes(cat.toLowerCase())) ||
    (text.includes('crash') || text.includes('error') ? 'Backend' : 'Frontend');

  const priorityKeywordMatched =
    text.includes('critical') ||
    text.includes('down') ||
    text.includes('urgent') ||
    text.includes('fail') ||
    text.includes('broken') ||
    text.includes('security') ||
    text.includes('minor') ||
    text.includes('typo');

  const priority =
    text.includes('critical') || text.includes('down') || text.includes('urgent')
      ? 'Critical'
      : text.includes('fail') || text.includes('broken') || text.includes('security')
      ? 'High'
      : text.includes('minor') || text.includes('typo')
      ? 'Low'
      : 'Medium'; // no keyword signal found — Medium is a safe, deterministic default rather than a coin flip

  // Longer, more detailed descriptions are treated as higher-effort work.
  // This is still a simple heuristic, not real estimation, but it's tied to
  // something the person actually wrote instead of being pure chance.
  const storyPoints = wordCount > 40 ? 8 : wordCount > 25 ? 5 : wordCount > 12 ? 3 : wordCount > 5 ? 2 : 1;

  const assignedMember = pickAssignee(categoryMatch);
  const assignee = assignedMember.name;
  assignedMember.activeTickets += 1; // reflect the new workload immediately so the next suggestion accounts for it

  // Confidence now reflects how much real signal was found in the text —
  // a keyword-matched category/priority and a detailed description raise it,
  // a vague one-line ticket leaves it low — instead of a random number.
  let confidence = 60;
  if (categoryKeywordMatched) confidence += 15;
  if (priorityKeywordMatched) confidence += 15;
  if (wordCount > 20) confidence += 7;
  confidence = Math.min(confidence, 97);

  return {
    category: categoryMatch,
    priority,
    storyPoints,
    assignee,
    confidence,
    reason: `${assignee} has strong experience in "${categoryMatch}" issues and currently has the lightest workload among qualified team members (${assignedMember.activeTickets} active tickets).`,
  };
}
