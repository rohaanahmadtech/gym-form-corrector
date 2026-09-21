function Metric({ label, value, sub, accent }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-gym-card border border-gym-border rounded-xl px-4 py-3">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-bold tabular-nums ${accent ?? 'text-white'}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}

function ConfidenceBar({ confidence, exercise }) {
  const pct   = Math.round((confidence ?? 0) * 100)
  const color = pct >= 75 ? 'bg-gym-green' : pct >= 50 ? 'bg-gym-yellow' : 'bg-gym-red'

  return (
    <div className="bg-gym-card border border-gym-border rounded-xl p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          Model Confidence
        </span>
        <span className="text-xs font-mono text-gray-400">{pct}%</span>
      </div>
      <div className="h-2 bg-gym-bg rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {exercise && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Detected: <span className="text-white font-medium">{exercise.label}</span>
        </p>
      )}
    </div>
  )
}

export default function MetricsPanel({
  repCount,
  phase,
  confidence,
  detectedExercise,
  elapsedSeconds,
}) {
  const mins = Math.floor(elapsedSeconds / 60)
  const secs = String(elapsedSeconds % 60).padStart(2, '0')

  const phaseColor =
    phase === 'up'   ? 'text-gym-green' :
    phase === 'down' ? 'text-gym-accent' :
    'text-gray-400'

  return (
    <div className="flex flex-col gap-3">
      {/* Rep count + timer + phase */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Reps" value={repCount} accent="text-gym-green" />
        <Metric
          label="Phase"
          value={phase === 'up' ? '↑' : phase === 'down' ? '↓' : '—'}
          sub={phase === 'up' ? 'Up' : phase === 'down' ? 'Down' : 'Idle'}
          accent={phaseColor}
        />
        <Metric
          label="Time"
          value={`${mins}:${secs}`}
          accent="text-gym-accent"
        />
      </div>

      {/* Confidence bar */}
      <ConfidenceBar confidence={confidence} exercise={detectedExercise} />
    </div>
  )
}
