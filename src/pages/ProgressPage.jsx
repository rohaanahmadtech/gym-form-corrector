import { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle, Warning, Shield } from '../components/Icons.jsx'

// ── localStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = 'gymFormAI_sessions'

export function saveSession(data) {
  try {
    const sessions = getSessions()
    sessions.unshift({ id: Date.now(), ...data })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 100)))
  } catch (_) {}
}

export function getSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch (_) { return [] }
}

// ── SVG line chart from real data ────────────────────────────────────────────
function LineChart({ sessions }) {
  if (sessions.length < 2) return (
    <div className="h-36 flex items-center justify-center text-gray-400 text-sm">
      Complete more sessions to see your trend
    </div>
  )

  const recent = [...sessions].reverse().slice(0, 8)
  const W = 340, H = 140, pad = { t:16, r:16, b:28, l:36 }
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b
  const xStep = iW / Math.max(recent.length - 1, 1)
  const yToPixel = v => pad.t + iH - ((v - 0) / 100) * iH
  const pts = recent.map((s, i) => ({ x: pad.l + i * xStep, y: yToPixel(s.formScore) }))
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L${pts[pts.length-1].x},${H-pad.b} L${pad.l},${H-pad.b} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[25,50,75,100].map(v => {
        const y = yToPixel(v)
        return <g key={v}>
          <line x1={pad.l} y1={y} x2={W-pad.r} y2={y} stroke="#f1f5f9" strokeWidth="1"/>
          <text x={pad.l-6} y={y+4} textAnchor="end" fontSize="9" fill="#9ca3af">{v}%</text>
        </g>
      })}
      <path d={areaD} fill="#22c55e" opacity="0.07"/>
      <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4.5" fill="#22c55e" stroke="white" strokeWidth="2"/>
          {i === pts.length-1 && <circle cx={p.x} cy={p.y} r="8" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.4"/>}
        </g>
      ))}
      {recent.map((s, i) => (
        <text key={i} x={pad.l + i*xStep} y={H-pad.b+14}
              textAnchor="middle" fontSize="8" fill="#9ca3af">
          {new Date(s.id).toLocaleDateString('en',{month:'short',day:'numeric'})}
        </text>
      ))}
    </svg>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ navigate }) {
  return (
    <div className="text-center py-20 max-w-sm mx-auto">
      <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">
        📊
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-3">No Sessions Yet</h2>
      <p className="text-gray-400 leading-relaxed mb-8">
        Complete your first workout to see your progress tracked here.
        Form scores, rep history and trends appear after each session.
      </p>
      <button onClick={() => navigate('choose')}
        className="inline-flex items-center gap-3 bg-gray-900 hover:bg-black
                   text-white font-bold text-base rounded-2xl px-8 py-4
                   shadow-xl transition-all duration-200">
        Start First Workout <ArrowRight size={17} className="text-white"/>
      </button>
    </div>
  )
}

const IMG_MAP = { bicep_curl:'/images/curl.jpg', push_up:'/images/pushup.jpg', squat:'/images/squat.jpg' }
const LABELS  = { bicep_curl:'Bicep Curl', push_up:'Push-up', squat:'Squat' }

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProgressPage({ navigate }) {
  const [sessions, setSessions]     = useState([])
  const [activeTab, setActiveTab]   = useState('all')

  // Load from localStorage on mount
  useEffect(() => {
    setSessions(getSessions())

    // Listen for storage changes from other tabs
    const onStorage = () => setSessions(getSessions())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (sessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">Your Progress</h1>
          <p className="text-gray-400 text-lg">Track your improvement over time</p>
        </div>
        <EmptyState navigate={navigate}/>
      </div>
    )
  }

  // ── Compute real stats ──
  const avgScore     = Math.round(sessions.reduce((s,x) => s + x.formScore, 0) / sessions.length)
  const totalReps    = sessions.reduce((s,x) => s + (x.totalReps || 0), 0)
  const totalSessions = sessions.length

  // Per-exercise breakdown
  const byExercise = {}
  sessions.forEach(s => {
    if (!byExercise[s.exerciseId]) byExercise[s.exerciseId] = { scores:[], reps:0 }
    byExercise[s.exerciseId].scores.push(s.formScore)
    byExercise[s.exerciseId].reps += s.totalReps || 0
  })
  const exStats = Object.entries(byExercise).map(([id, d]) => ({
    id, label: LABELS[id] || id,
    avg: Math.round(d.scores.reduce((a,b)=>a+b,0)/d.scores.length),
    reps: d.reps,
    sessions: d.scores.length,
    img: IMG_MAP[id],
  })).sort((a,b) => b.avg - a.avg)

  // Streak: consecutive days with at least 1 session
  const days = [...new Set(sessions.map(s => new Date(s.id).toDateString()))]
  const streak = days.length // simplified

  // Best score
  const bestScore = Math.max(...sessions.map(s => s.formScore))

  // Last 3 sessions for the insight message
  const lastScore   = sessions[0]?.formScore || 0
  const prevScore   = sessions[1]?.formScore || lastScore
  const improvement = lastScore - prevScore
  const insightMsg  = improvement > 0
    ? `You're improving! Form score up ${improvement}% from your last session. Keep it up!`
    : improvement < 0
    ? `Tough session — form was down ${Math.abs(improvement)}%. Focus on range of motion next time.`
    : 'Consistent! Same form score as last session. Try going deeper on your reps.'

  const clearAll = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSessions([])
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">Your Progress</h1>
          <p className="text-gray-400 text-lg">Track your improvement over time</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('choose')}
            className="btn-dark px-5 py-2.5 text-sm hidden sm:flex">
            New Session <ArrowRight size={15} className="text-white"/>
          </button>
          <button onClick={clearAll}
            className="text-xs text-gray-300 hover:text-red-400 border border-gray-200
                       hover:border-red-200 rounded-xl px-3 py-2.5 transition-colors">
            Clear data
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { v: `${avgScore}%`,    l:'Avg Form Score'  },
          { v: totalReps,         l:'Total Reps'       },
          { v: totalSessions,     l:'Total Sessions'   },
          { v: `${bestScore}%`,   l:'Best Score'       },
        ].map(s => (
          <div key={s.l} className="card p-5 text-center hover:shadow-md transition-shadow">
            <p className="text-3xl font-black text-gray-900 mb-1">{s.v}</p>
            <p className="text-xs text-gray-400">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* LEFT */}
        <div className="space-y-6">

          {/* Trend chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Form Score Trend</h3>
              <span className="text-xs text-gray-400">{sessions.length} session{sessions.length!==1?'s':''}</span>
            </div>
            <LineChart sessions={sessions}/>
          </div>

          {/* Recent sessions */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Recent Sessions</h3>
            </div>
            <div className="space-y-2">
              {sessions.slice(0, 8).map(s => {
                const dt = new Date(s.id)
                const dateStr = dt.toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
                const scoreColor = s.formScore>=80?'text-green-600':s.formScore>=60?'text-yellow-600':'text-red-500'
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <img src={IMG_MAP[s.exerciseId]||'/images/hero.jpg'} alt={s.exercise}
                         className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{s.exercise}</p>
                      <p className="text-xs text-gray-400">{dateStr} · {s.totalReps||0} reps</p>
                    </div>
                    <span className={`text-sm font-black rounded-full px-3 py-1 bg-gray-50 ${scoreColor}`}>
                      {s.formScore}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">

          {/* Exercise performance */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-5">Exercise Performance</h3>
            {exStats.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet</p>
            ) : (
              <div className="space-y-5">
                {exStats.map(ex => (
                  <div key={ex.id} className="flex items-center gap-3">
                    <img src={ex.img} alt={ex.label}
                         className="w-10 h-10 rounded-xl object-cover flex-shrink-0"/>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-800">{ex.label}</span>
                        <span className={`text-sm font-black ${ex.avg>=80?'text-green-600':ex.avg>=60?'text-yellow-600':'text-red-500'}`}>
                          {ex.avg}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                             style={{ width:`${ex.avg}%`, background: ex.avg>=80?'#22c55e':ex.avg>=60?'#f59e0b':'#ef4444' }}/>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {ex.sessions} session{ex.sessions!==1?'s':''} · {ex.reps} reps
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Insight */}
          <div className="card p-5 border-l-4 border-gray-900">
            <div className="flex items-start gap-3">
              <img src={IMG_MAP[sessions[0]?.exerciseId]||'/images/hero.jpg'}
                   alt="insight" className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/>
              <div>
                <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">
                  Latest Insight
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">{insightMsg}</p>
              </div>
            </div>
          </div>

          {/* Score breakdown latest session */}
          {sessions[0] && (
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-3">Last Session Breakdown</h3>
              <p className="text-xs text-gray-400 mb-3">{LABELS[sessions[0].exerciseId]}</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { v: sessions[0].totalReps||0,   l:'Total Reps'  },
                  { v: sessions[0].correctReps||0,  l:'Correct'     },
                  { v: sessions[0].needsWork||0,    l:'Needs Work'  },
                ].map(s => (
                  <div key={s.l} className="bg-gray-50 rounded-xl py-3">
                    <p className="text-2xl font-black text-gray-900">{s.v}</p>
                    <p className="text-[10px] text-gray-400">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-gray-400 justify-center">
            <Shield size={11} className="text-gray-400"/>
            Data stored locally in your browser only
          </div>
        </div>
      </div>
    </div>
  )
}