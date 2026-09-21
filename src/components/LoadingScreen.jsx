export default function LoadingScreen({ mpStatus, modelStatus, mpError, modelError }) {
  const items = [
    {
      label: 'MediaPipe Pose (WASM)',
      status: mpStatus,
      error:  mpError,
      note:   '~5 MB, cached after first load',
    },
    {
      label: 'Exercise Classifier (TF.js)',
      status: modelStatus,
      error:  modelError,
      note:   '~244 KB (model.json + .bin)',
    },
  ]

  const icon = (status) => {
    if (status === 'ready')   return <span className="text-gym-green">✓</span>
    if (status === 'error')   return <span className="text-gym-red">✕</span>
    if (status === 'loading') return (
      <span className="inline-block w-4 h-4 border-2 border-gym-accent border-t-transparent rounded-full animate-spin" />
    )
    return <span className="text-gray-600">○</span>
  }

  const anyError = mpError || modelError

  return (
    <div className="min-h-screen flex items-center justify-center bg-gym-bg p-6">
      <div className="w-full max-w-sm bg-gym-surface border border-gym-border rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">🏋️</div>
        <h1 className="text-xl font-bold mb-1">AI Gym Assistant</h1>
        <p className="text-sm text-gray-500 mb-8">Initialising…</p>

        <div className="flex flex-col gap-4 text-left">
          {items.map(item => (
            <div key={item.label}
              className="flex items-start gap-3 bg-gym-card border border-gym-border rounded-xl p-4"
            >
              <div className="mt-0.5 text-lg flex-shrink-0">{icon(item.status)}</div>
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                {item.error
                  ? <p className="text-xs text-gym-red mt-1">{item.error}</p>
                  : <p className="text-xs text-gray-500 mt-1">{item.note}</p>
                }
              </div>
            </div>
          ))}
        </div>

        {anyError && (
          <div className="mt-6 bg-gym-red/10 border border-gym-red/30 rounded-xl p-4 text-left">
            <p className="text-xs text-red-300 font-medium mb-1">Troubleshooting</p>
            <ul className="text-xs text-red-300/80 space-y-1 list-disc list-inside">
              <li>Check that <code className="font-mono">public/model/model.json</code> exists</li>
              <li>Check that <code className="font-mono">public/scaler_params.json</code> exists</li>
              <li>Make sure you are running on <code className="font-mono">localhost</code></li>
              <li>Check the browser console for details</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
