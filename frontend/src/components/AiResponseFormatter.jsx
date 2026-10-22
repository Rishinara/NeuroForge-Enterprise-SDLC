import { useState, useMemo } from 'react'
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  ShieldAlert,
  Lightbulb,
  BarChart3,
  FileText,
  Check,
  Copy,
  Tag,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react'

/**
 * Extracts clean string content from raw AI response payloads,
 * handling DTOs, JSON strings, and nested response objects.
 */
export function extractCleanText(input) {
  if (!input) return ''
  let text = input

  if (typeof text === 'object') {
    text =
      text.reason ||
      text.response ||
      text.analysis ||
      text.enhancedDescription ||
      text.result ||
      text.message ||
      Object.values(text).find((v) => typeof v === 'string') ||
      ''
  }

  if (typeof text === 'string') {
    text = text.trim()
    // If it's a stringified JSON (e.g. {"storyPoints":null,"reason":"..."}), unwrap it
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const obj = JSON.parse(text)
        return extractCleanText(obj)
      } catch {
        // Not valid JSON, continue with string
      }
    }
    // Unescape literal \n or \\n that might have come from serialized JSON
    text = text.replace(/\\n/g, '\n')
    // Remove unwanted carriage returns
    text = text.replace(/\r/g, '')
  }

  return typeof text === 'string' ? text.trim() : String(text)
}

/**
 * Formats inline markdown like **bold**, *italic*, `code` into React elements
 * without displaying raw asterisk symbols.
 */
function formatInlineText(text) {
  if (!text) return text
  // Clean double-escaped newlines and trim
  const clean = String(text).replace(/\\n/g, ' ').trim()
  // Split on **bold**, *italic*, or `code`
  const parts = clean.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={i} className="font-medium text-slate-800">
          {part.slice(1, -1)}
        </span>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

/**
 * Cleans section headers (stripping ###, asterisks, numbers, colons).
 */
function cleanSectionTitle(title = '') {
  return title
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/[*_:`]/g, '')
    .trim()
}

/**
 * Parses cleaned AI text into structured sections, badges, and health indicators.
 */
function parseAiResponse(rawInput) {
  const text = extractCleanText(rawInput)
  if (!text) return { sections: [], badges: [], health: null, raw: '' }

  const badges = []
  let health = null

  // Extract Sprint Health / Status
  const healthMatch = text.match(/(?:Sprint Health|Health|Status)\s*:\s*([^\n\r.]+)/i)
  if (healthMatch) {
    const val = healthMatch[1].replace(/[*_#]/g, '').trim()
    let type = 'info'
    if (/healthy|on track|good|normal/i.test(val)) type = 'success'
    else if (/moderate|risk|warning|medium/i.test(val)) type = 'warning'
    else if (/critical|danger|high risk|severe/i.test(val)) type = 'danger'
    health = { label: val, type }
  }

  // Extract Story Points
  const spMatch = text.match(/Story Points\s*:\s*([0-9]+)/i)
  if (spMatch) {
    badges.push({ label: `${spMatch[1]} Points`, icon: Tag, color: 'indigo' })
  }

  // Extract Priority
  const prioMatch = text.match(/Priority\s*:\s*(LOW|MEDIUM|HIGH|CRITICAL)/i)
  if (prioMatch) {
    const p = prioMatch[1].toUpperCase()
    const colorMap = { CRITICAL: 'rose', HIGH: 'orange', MEDIUM: 'amber', LOW: 'blue' }
    badges.push({ label: `${p} Priority`, icon: Clock, color: colorMap[p] || 'slate' })
  }

  const lines = text.split('\n')
  const sections = []
  let currentSection = { title: '', items: [], textLines: [] }

  const sectionHeaderRegex = /^(?:#{2,4}\s+|\d+\.\s+)(.+)$/
  const colonHeaderRegex = /^([A-Z][A-Za-z0-9\s/&]{2,40}):\s*$/

  for (let line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Skip redundant top-level property lines that are already rendered as badges
    if (/^(?:Story Points|Priority|Sprint Health)\s*:/i.test(trimmed)) {
      continue
    }

    const headerMatch = trimmed.match(sectionHeaderRegex) || trimmed.match(colonHeaderRegex)
    if (headerMatch && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
      const titleCandidate = cleanSectionTitle(headerMatch[1])

      if (currentSection.title || currentSection.items.length || currentSection.textLines.length) {
        sections.push(currentSection)
      }
      currentSection = { title: titleCandidate, items: [], textLines: [] }
      continue
    }

    // List item check (- or * or numbered list inside a section)
    if (/^[-*•]\s+/.test(trimmed)) {
      const cleanBullet = trimmed.replace(/^[-*•]\s+/, '').trim()
      if (cleanBullet) currentSection.items.push(cleanBullet)
    } else if (/^\d+\.\s+/.test(trimmed) && currentSection.title) {
      const cleanNumbered = trimmed.replace(/^\d+\.\s+/, '').trim()
      if (cleanNumbered) currentSection.items.push(cleanNumbered)
    } else {
      currentSection.textLines.push(trimmed)
    }
  }

  if (currentSection.title || currentSection.items.length || currentSection.textLines.length) {
    sections.push(currentSection)
  }

  return { sections, badges, health, raw: text }
}

function getSectionMeta(title = '') {
  const t = title.toLowerCase()
  if (t.includes('risk') || t.includes('delay') || t.includes('bottleneck') || t.includes('danger')) {
    return {
      icon: ShieldAlert,
      bg: 'bg-rose-50/70',
      border: 'border-rose-200/80',
      text: 'text-rose-900',
      badgeBg: 'bg-rose-100 text-rose-700',
      bulletColor: 'bg-rose-500'
    }
  }
  if (t.includes('recommend') || t.includes('suggestion') || t.includes('tip') || t.includes('action') || t.includes('consideration')) {
    return {
      icon: Lightbulb,
      bg: 'bg-amber-50/70',
      border: 'border-amber-200/80',
      text: 'text-amber-900',
      badgeBg: 'bg-amber-100 text-amber-700',
      bulletColor: 'bg-amber-500'
    }
  }
  if (t.includes('workload') || t.includes('task') || t.includes('breakdown') || t.includes('subtask') || t.includes('distribution')) {
    return {
      icon: BarChart3,
      bg: 'bg-sky-50/70',
      border: 'border-sky-200/80',
      text: 'text-sky-900',
      badgeBg: 'bg-sky-100 text-sky-700',
      bulletColor: 'bg-sky-500'
    }
  }
  if (t.includes('criteria') || t.includes('requirement') || t.includes('acceptance') || t.includes('validation')) {
    return {
      icon: CheckCircle2,
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200/80',
      text: 'text-emerald-900',
      badgeBg: 'bg-emerald-100 text-emerald-700',
      bulletColor: 'bg-emerald-500'
    }
  }
  return {
    icon: FileText,
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-800',
    badgeBg: 'bg-slate-200 text-slate-700',
    bulletColor: 'bg-indigo-500'
  }
}

export default function AiResponseFormatter({
  content = '',
  title = 'AI Intelligence Report',
  className = ''
}) {
  const [copied, setCopied] = useState(false)
  const [viewRaw, setViewRaw] = useState(false)

  const parsed = useMemo(() => parseAiResponse(content), [content])

  const handleCopy = () => {
    if (!parsed.raw) return
    navigator.clipboard.writeText(parsed.raw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!content) return null

  const hasStructuredSections = parsed.sections.length > 0 && parsed.sections.some((s) => s.title)

  return (
    <div className={`flex flex-col gap-3 font-sans ${className}`}>
      {/* Header Bar with Badges and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
            <Sparkles size={14} className="text-orange-500" />
            <span>{title}</span>
          </div>

          {/* Health Pill */}
          {parsed.health && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                parsed.health.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : parsed.health.type === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              {parsed.health.type === 'success' ? (
                <ShieldCheck size={12} />
              ) : parsed.health.type === 'warning' ? (
                <AlertTriangle size={12} />
              ) : (
                <Flame size={12} />
              )}
              {parsed.health.label}
            </span>
          )}

          {/* Extra Badges (Priority, Points) */}
          {parsed.badges.map((b, i) => {
            const Icon = b.icon
            return (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  b.color === 'rose'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : b.color === 'orange'
                    ? 'bg-orange-50 text-orange-700 border-orange-300'
                    : b.color === 'amber'
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-300'
                }`}
              >
                {Icon && <Icon size={11} />}
                {b.label}
              </span>
            )
          })}
        </div>

        {/* Copy & View Raw Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setViewRaw(!viewRaw)}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded transition-colors"
          >
            {viewRaw ? 'Structured View' : 'Raw Text'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded shadow-2xs hover:bg-slate-50 transition-colors"
            title="Copy response to clipboard"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Raw View Toggle */}
      {viewRaw ? (
        <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed border border-slate-800">
          {parsed.raw}
        </pre>
      ) : hasStructuredSections ? (
        /* Structured Cards Layout */
        <div className="flex flex-col gap-2.5">
          {parsed.sections.map((section, idx) => {
            const meta = getSectionMeta(section.title)
            const SectionIcon = meta.icon

            return (
              <div
                key={idx}
                className={`rounded-xl border p-3 ${meta.bg} ${meta.border} transition-all hover:shadow-xs`}
              >
                {section.title && (
                  <div className="flex items-center gap-2 mb-2 font-semibold text-xs tracking-tight">
                    <div className={`p-1 rounded-md ${meta.badgeBg}`}>
                      <SectionIcon size={13} />
                    </div>
                    <span className={meta.text}>{section.title}</span>
                  </div>
                )}

                {/* Paragraph Lines */}
                {section.textLines.length > 0 && (
                  <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                    {section.textLines.map((l, lineIdx) => (
                      <p key={lineIdx}>{formatInlineText(l)}</p>
                    ))}
                  </div>
                )}

                {/* Bullet List Items */}
                {section.items.length > 0 && (
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2.5">
                        <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${meta.bulletColor}`} />
                        <span className="leading-relaxed text-slate-700 font-normal">
                          {formatInlineText(item)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Fallback Clean View for short outputs */
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
          {formatInlineText(parsed.raw)}
        </div>
      )}
    </div>
  )
}
