import { EXERCISES } from '../lib/constants.js'

export default function ExerciseSelector({ selected, onSelect, disabled }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
        Select Exercise
      </p>
      <div className="grid grid-cols-3 gap-3">
        {EXERCISES.map(ex => {
          const isActive = selected?.id === ex.id
          return (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              disabled={disabled}
              className={[
                'flex flex-col items-center gap-2 rounded-xl border p-4',
                'text-sm font-medium transition-all duration-200',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isActive
                  ? 'border-gym-accent bg-gym-accent/20 text-white shadow-lg shadow-gym-accent/20'
                  : 'border-gym-border bg-gym-card text-gray-400 hover:border-gym-accent/60 hover:text-white',
              ].join(' ')}
            >
              <span className="text-2xl">{ex.emoji}</span>
              <span className="leading-tight text-center">{ex.label}</span>
            </button>
          )
        })}
      </div>

      {selected && (
        <p className="text-xs text-gray-500 text-center mt-1">
          📷 {selected.cameraHint}
        </p>
      )}
    </div>
  )
}
