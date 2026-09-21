import { CheckCircle, Warning, ArrowLeft, ArrowCounterClockwise, Timer, Calendar, Barbell, Shield, TrendingUp, Check } from '../components/Icons.jsx'

function ScoreGauge({ score, size=170 }) {
  const r=(size-14)/2, circ=2*Math.PI*r, pct=Math.max(0,Math.min(100,score||0))
  const color = pct>=80?'#22c55e':pct>=60?'#f59e0b':'#ef4444'
  const label = pct>=90?'Excellent Form':pct>=75?'Great Form':pct>=60?'Good Form':'Needs Work'
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#f1f5f9" strokeWidth="12" fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="12" fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
          transform={`rotate(-90 ${size/2} ${size/2})`}/>
        <text x="50%" y="47%" textAnchor="middle" fontSize="28" fontWeight="900" fill="#111827">{pct}%</text>
        <text x="50%" y="60%" textAnchor="middle" fontSize="9" fontWeight="600" fill="#9ca3af">FORM SCORE</text>
      </svg>
      <span className="font-bold mt-1" style={{color}}>{label}</span>
    </div>
  )
}

function RepBar({ totalReps, correctReps }) {
  if (!totalReps) return <p className="text-sm text-gray-400 text-center py-4">No reps recorded</p>
  return (
    <div>
      <div className="flex items-end gap-1 h-16">
        {Array.from({length:totalReps},(_,i)=>(
          <div key={i} className="flex-1 rounded-t transition-all"
            style={{height:i<correctReps?'100%':'40%',background:i<correctReps?'#22c55e':'#fbbf24'}}/>
        ))}
      </div>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-brand-500 inline-block"/>Correct ({correctReps})</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block"/>Needs Work ({totalReps-correctReps})</div>
      </div>
    </div>
  )
}

export default function ResultsPage({ results, exercise, navigate }) {
  if (!results) { navigate('choose'); return null }
  const { totalReps, correctReps, needsWork, formScore, duration } = results
  const mins=Math.floor(duration/60), secs=String(duration%60).padStart(2,'0')
  const durStr=`${mins}:${secs}`

  // Exercise image mapping
  const imgMap = { bicep_curl:'/images/curl.jpg', push_up:'/images/pushup.jpg', squat:'/images/squat.jpg' }
  const exImg = imgMap[exercise?.id] || '/images/hero.jpg'

  const goodPoints = formScore>=80
    ? ['Good body alignment throughout','Consistent range of motion','Stable core throughout']
    : formScore>=60
    ? ['Completed the full set','Maintained movement pattern']
    : ['Completed the session — great effort']

  const improvements = formScore>=90
    ? ['Try slower tempo for more control']
    : formScore>=75
    ? ['Maintain full range of motion','Keep hips level throughout']
    : ['Avoid flaring elbows','Keep hips level','Maintain full range of motion']

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Check size={20} className="text-white"/>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Session Complete</h1>
            <p className="text-gray-400">Great effort! Here&apos;s how you did.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Score + stats */}
        <div className="space-y-5">
          <div className="card p-8">
            <p className="text-sm font-bold text-gray-500 mb-5">Form Score</p>
            <div className="flex justify-center mb-7"><ScoreGauge score={formScore}/></div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                {v:totalReps,  l:'Total Reps', c:'text-gray-900'},
                {v:correctReps,l:'Correct',    c:'text-gray-900'},
                {v:needsWork,  l:'Need Work',  c:'text-red-500'},
              ].map(s=>(
                <div key={s.l} className="bg-gray-50 rounded-xl py-4">
                  <p className={`text-3xl font-black ${s.c}`}>{s.v}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rep quality chart */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4">Rep Quality</h3>
            <RepBar totalReps={totalReps} correctReps={correctReps}/>
          </div>
        </div>

        {/* Right: Image + breakdown */}
        <div className="space-y-5">
          {/* Exercise image card */}
          <div className="card overflow-hidden">
            <div className="relative h-52">
              <img src={exImg} alt={exercise?.label} className="w-full h-full object-cover object-top"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white font-black text-xl">{exercise?.label}</p>
                    <p className="text-white/70 text-xs">Session complete</p>
                  </div>
                  <div className="card px-4 py-2 text-center">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider">Duration</p>
                    <p className="font-black text-gray-900 text-lg">{durStr}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What went well */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-brand-100 rounded-lg flex items-center justify-center"><Check size={13} className="text-brand-600"/></div>
              <h3 className="font-bold text-gray-900">What Went Well</h3>
            </div>
            <ul className="space-y-2">
              {goodPoints.map(p=>(
                <li key={p} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <CheckCircle size={14} className="text-brand-500 flex-shrink-0"/>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Improve */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center"><Warning size={13} className="text-red-500"/></div>
              <h3 className="font-bold text-gray-900">Improve Next Time</h3>
            </div>
            <ul className="space-y-2">
              {improvements.map(p=>(
                <li key={p} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Warning size={14} className="text-amber-400 flex-shrink-0"/>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
        <button onClick={()=>navigate('analysis',{exercise})} className="btn-dark px-10 py-3.5 text-base justify-center">
          <ArrowCounterClockwise size={17} className="text-white"/>Train Again
        </button>
        <button onClick={()=>navigate('choose')} className="btn-outline px-10 py-3.5 text-base justify-center">
          <ArrowLeft size={17}/>Back to Exercises
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center mt-6 flex items-center justify-center gap-1.5">
        <Shield size={11} className="text-brand-500"/>Session processed privately in your browser
      </p>
    </div>
  )
}