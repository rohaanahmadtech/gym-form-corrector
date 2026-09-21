import { useEffect, useRef } from 'react'

const SEVERITY_STYLE = {
  warning: {
    border: 'border-gym-red/50',
    bg:     'bg-gym-red/10',
    icon:   '⚠️',
    text:   'text-red-300',
  },
  info: {
    border: 'border-gym-yellow/50',
    bg:     'bg-gym-yellow/10',
    icon:   'ℹ️',
    text:   'text-yellow-300',
  },
  good: {
    border: 'border-gym-green/50',
    bg:     'bg-gym-green/10',
    icon:   '✅',
    text:   'text-green-300',
  },
}

export default function FeedbackPanel({ cue, warning, isRunning }) {
  const prevCueRef = useRef(null)

  // Track cue changes (for animation trigger if needed)
  useEffect(() => {
    if (cue?.id !== prevCueRef.current?.id) {
      prevCueRef.current = cue
    }
  }, [cue])

  if (!isRunning) {
    return (
      <div className="bg-gym-card border border-gym-border rounded-xl p-4 text-center">
        <p className="text-sm text-gray-500">
          Form feedback appears here during your set.
        </p>
        <p className="text-xs text-gray-600 mt-2">
          ⚠️ This system identifies exercises only. Form rules are angle-based
          estimates — not a substitute for a qualified trainer.
        </p>
      </div>
    )
  }

  // Show visibility/setup warning first (highest priority)
  if (warning) {
    const s = SEVERITY_STYLE.warning
    return (
      <div className={`border ${s.border} ${s.bg} rounded-xl p-4`}>
        <div className="flex items-start gap-3">
          <span className="text-lg">{s.icon}</span>
          <p className={`text-sm ${s.text} leading-snug`}>{warning}</p>
        </div>
      </div>
    )
  }

  // Good form
  if (!cue) {
    const s = SEVERITY_STYLE.good
    return (
      <div className={`border ${s.border} ${s.bg} rounded-xl p-4`}>
        <div className="flex items-start gap-3">
          <span className="text-lg">{s.icon}</span>
          <p className={`text-sm ${s.text} leading-snug`}>
            Looking good — keep it up!
          </p>
        </div>
      </div>
    )
  }

  // Form correction cue
  const s = SEVERITY_STYLE[cue.severity] ?? SEVERITY_STYLE.info
  return (
    <div className={`border ${s.border} ${s.bg} rounded-xl p-4 transition-all duration-300`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{s.icon}</span>
        <p className={`text-sm ${s.text} leading-snug font-medium`}>
          {cue.message}
        </p>
      </div>
    </div>
  )
}
