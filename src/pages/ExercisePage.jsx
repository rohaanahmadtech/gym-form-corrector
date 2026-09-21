import { ArrowRight, Shield, CheckCircle } from '../components/Icons.jsx'

const EXERCISES = [
  {
    id:'bicep_curl', label:'Bicep Curl', classIdx:0,
    image:'/images/curl.jpg',
    desc:'AI form analysis and rep counting',
    detail:'Tracks elbow angle, elbow stability, torso sway and wrist position in real time.',
    tags:['Upper Body','Beginner'],
    hint:'Stand side-on · Camera at waist height · 2–3 m',
  },
  {
    id:'push_up', label:'Push-up', classIdx:1,
    image:'/images/pushup.jpg',
    desc:'Real-time form feedback and rep tracking',
    detail:'Monitors body alignment, elbow depth and detects hip sag or pike throughout the set.',
    tags:['Full Body','Intermediate'],
    hint:'Side view · Low camera · Full body visible',
  },
  {
    id:'squat', label:'Squat', classIdx:2,
    image:'/images/squat.jpg',
    desc:'Lower body form analysis and depth detection',
    detail:'Checks squat depth, forward trunk lean, knee symmetry and descent control.',
    tags:['Lower Body','Beginner'],
    hint:'Stand side-on · Camera at hip height · 2–3 m',
  },
]

export default function ExercisePage({ navigate }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3">Choose Your Exercise</h1>
        <p className="text-gray-500 text-lg">Select an exercise to start AI form analysis</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {EXERCISES.map(ex => (
          <div key={ex.id} className="card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
            {/* Exercise image */}
            <div className="relative h-52 overflow-hidden bg-gray-100">
              <img src={ex.image} alt={ex.label} className="w-full h-full object-cover object-top"/>
              <div className="absolute top-3 left-3 flex gap-1.5">
                {ex.tags.map(t => (
                  <span key={t} className="text-[10px] font-bold uppercase bg-black/50 text-white backdrop-blur-sm rounded-full px-2.5 py-0.5">{t}</span>
                ))}
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-black text-gray-900 mb-1">{ex.label}</h3>
              <p className="text-sm text-gray-500 mb-3">{ex.desc}</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-5">{ex.detail}</p>
              <p className="text-xs text-gray-400 mb-5">&#128247; {ex.hint}</p>
              <button onClick={() => navigate('analysis', { exercise: ex })}
                className="btn-dark w-full py-3 mt-auto justify-center text-sm">
                Start Analysis <ArrowRight size={15} className="text-white"/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="card p-7 bg-gray-50 border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Before You Begin</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'Allow camera access when prompted',
            'Keep your full body visible in frame',
            'Use a well-lit environment',
            'Video is processed locally — never uploaded',
            'Fitted clothing improves landmark accuracy',
            'Side-view camera works best for most exercises',
          ].map(t => (
            <div key={t} className="flex items-start gap-2.5 text-sm text-gray-600">
              <CheckCircle size={15} className="text-brand-500 mt-0.5 flex-shrink-0"/>
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}