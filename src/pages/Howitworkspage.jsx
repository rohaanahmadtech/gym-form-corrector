import { ArrowRight, Shield, CheckCircle, VideoCamera, Barbell, CaretRight } from '../components/Icons.jsx'

const STEPS = [
  {
    n:'01', color:'#111827', bg:'#f8fafc',
    title:'Camera Capture',
    sub:'Your browser, not a server',
    desc:"The browser's native camera API captures live video at 30 FPS. No plugin, no app download. Camera data never leaves your device at any point.",
    visual:'📹',
  },
  {
    n:'02', color:'#111827', bg:'#f0fdf4',
    title:'Pose Estimation',
    sub:'Google MediaPipe BlazePose',
    desc:'Each frame is processed by a WebAssembly model identifying 33 body landmarks — shoulders, elbows, wrists, hips, knees and ankles — with x, y, z coordinates in under 30ms.',
    visual:'🦴',
  },
  {
    n:'03', color:'#111827', bg:'#faf5ff',
    title:'Feature Extraction',
    sub:'210 features per frame',
    desc:'Landmarks are normalised relative to hip position and torso length. Joint angles, velocities and body alignment are computed every frame — making measurements body-size invariant.',
    visual:'📐',
  },
  {
    n:'04', color:'#111827', bg:'#fff7ed',
    title:'Exercise Classification',
    sub:'244 KB neural network',
    desc:'A lightweight GRU model running via TensorFlow.js classifies each 30-frame window as Bicep Curl, Push-up or Squat. Inference takes under 10ms per prediction.',
    visual:'🧠',
  },
  {
    n:'05', color:'#111827', bg:'#f0f9ff',
    title:'Rep Counting',
    sub:'State machine on Y-position',
    desc:"Key landmark positions are tracked over time. A state machine with hysteresis detects complete repetitions while filtering out partial or incomplete movements.",
    visual:'🔁',
  },
  {
    n:'06', color:'#111827', bg:'#fef2f2',
    title:'Form Feedback',
    sub:'One coaching cue per rep',
    desc:'Biomechanical rules check joint angles against exercise-specific thresholds. A single prioritised cue is shown per rep — not a wall of warnings.',
    visual:'✅',
  },
]

function StepCard({ step }) {
  return (
    <div className="card overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <div className="px-7 py-6 flex items-start gap-5"
           style={{ background: step.bg }}>
        <span className="text-4xl leading-none">{step.visual}</span>
        <div>
          <p className="text-xs font-black text-gray-300 mb-0.5">{step.n}</p>
          <h3 className="text-xl font-black text-gray-900">{step.title}</h3>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">{step.sub}</p>
        </div>
      </div>
      <div className="px-7 py-5">
        <p className="text-gray-500 leading-relaxed text-sm">{step.desc}</p>
      </div>
    </div>
  )
}

export default function HowItWorksPage({ navigate }) {
  return (
    <div>
      {/* Hero banner */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <nav className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-8">
            <button className="hover:text-gray-300 transition-colors"
                    onClick={() => navigate('landing')}>Home</button>
            <CaretRight size={12}/><span className="text-gray-400">How It Works</span>
          </nav>
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4">
            Behind the Scenes
          </p>
          <h1 className="text-5xl sm:text-6xl font-black mb-5 leading-tight">
            How It Works
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
            A real-time computer vision pipeline runs entirely in your browser —
            no server, no uploads, no latency.
          </p>
        </div>
      </div>

      {/* Pipeline stats bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { v:'33',    l:'Body Landmarks'    },
              { v:'30ms',  l:'Per-frame latency' },
              { v:'244 KB',l:'Model size'        },
              { v:'100%',  l:'Private'           },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-2xl font-black text-gray-900">{s.v}</p>
                <p className="text-xs text-gray-400">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Steps grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          {STEPS.map(step => <StepCard key={step.n} step={step}/>)}
        </div>

        {/* Tech stack */}
        <div className="mb-12">
          <p className="section-label mb-8 text-center">Technology</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { t:'MediaPipe BlazePose', d:'Google\'s production pose estimation model running as WebAssembly. 33 landmarks at 30 FPS on any modern device.' },
              { t:'TensorFlow.js',       d:'In-browser ML inference with GPU acceleration via WebGL. Exercise classifier runs at sub-10ms latency.' },
              { t:'Local Processing',    d:'The entire pipeline — camera, pose, classification and feedback — runs in your browser. Zero data transmitted.' },
              { t:'Biomechanical Rules', d:'Joint-angle thresholds derived from exercise science literature provide interpretable coaching cues.' },
            ].map(item => (
              <div key={item.t} className="card p-5 flex gap-4">
                <div className="w-2 h-2 rounded-full bg-gray-900 mt-2 flex-shrink-0"/>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{item.t}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy card */}
        <div className="bg-gray-900 rounded-3xl p-10 mb-10 text-white">
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center
                            justify-center flex-shrink-0 text-2xl">
              🔒
            </div>
            <div>
              <h3 className="font-black text-2xl mb-3">Fully Private by Design</h3>
              <p className="text-gray-400 leading-relaxed text-lg">
                Your camera feed is never sent to any server. Pose landmarks are
                computed locally and discarded after analysis. No workout data is
                stored beyond your current browser session.
              </p>
            </div>
          </div>
        </div>

        {/* Scope note */}
        <div className="card p-6 border-l-4 border-gray-300 mb-12">
          <h3 className="font-bold text-gray-900 mb-1">Scope Note</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            This system provides angle-based coaching cues derived from exercise science
            literature. It is not a medical device and does not replace a certified
            personal trainer or physiotherapist. Stop immediately if you experience pain.
          </p>
        </div>

        <div className="text-center">
          <button onClick={() => navigate('choose')}
            className="inline-flex items-center gap-3 bg-gray-900 hover:bg-black
                       text-white font-bold text-lg rounded-2xl px-10 py-4
                       shadow-xl transition-all duration-200 hover:scale-[1.02]">
            Try It Now
            <span className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
              <ArrowRight size={17} className="text-white"/>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}