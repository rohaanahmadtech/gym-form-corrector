import { ArrowRight, Shield, Check } from '../components/Icons.jsx'

/* Hero demo card — NO skeleton overlay, image already has it */
function HeroDemoCard() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
      <img src="/images/hero.jpg" alt="Live analysis demo"
           className="w-full h-full object-cover object-top"/>

      {/* LIVE + exercise badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2
                      bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
        <span className="text-sm font-bold text-gray-900">Squat</span>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
        <span className="text-sm font-bold text-green-600">LIVE</span>
      </div>

      {/* Metric cards */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-2.5
                        text-center shadow-md min-w-[76px]">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">FORM</p>
          <p className="text-xl font-black text-green-500">92%</p>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-2.5
                        text-center shadow-md">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">REP</p>
          <p className="text-xl font-black text-gray-900">8</p>
        </div>
      </div>

      {/* Feedback pill */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3
                        shadow-lg flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center
                          justify-center flex-shrink-0">
            <Check size={12} className="text-white"/>
          </div>
          <p className="text-sm font-semibold text-gray-800">
            Great form — keep your knees aligned
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage({ navigate }) {
  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">

          {/* Left */}
          <div>
            {/* Badge — grey not green */}
            <div className="inline-flex items-center gap-2 border border-gray-300
                            bg-white rounded-full px-4 py-1.5 text-xs font-bold
                            tracking-widest uppercase text-gray-500 mb-8 shadow-sm">
              AI-Powered Form Coach
            </div>

            <h1 className="text-6xl sm:text-7xl font-black text-gray-900
                           leading-none tracking-tight mb-6">
              Perfect<br/>Every Rep.
            </h1>

            <p className="text-gray-500 text-xl leading-relaxed mb-10 max-w-md">
              Real-time exercise detection, rep counting and instant form
              feedback — directly in your browser.
            </p>

            {/* Buttons — modern redesign */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => navigate('choose')}
                className="inline-flex items-center gap-3 bg-gray-900 hover:bg-black
                           text-white font-bold text-base rounded-2xl px-8 py-4
                           shadow-xl shadow-gray-900/25 transition-all duration-200
                           hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Live Analysis
                <span className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                  <ArrowRight size={16} className="text-white"/>
                </span>
              </button>

              <button
                onClick={() => navigate('howitworks')}
                className="inline-flex items-center gap-3 bg-white hover:bg-gray-50
                           border-2 border-gray-200 hover:border-gray-300
                           text-gray-700 font-bold text-base rounded-2xl px-8 py-4
                           shadow-sm transition-all duration-200
                           hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-[11px] font-black">&#9654;</span>
                </span>
                See How It Works
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400 mb-12">
              <Shield size={14} className="text-gray-400"/>
              Your camera stays on your device
            </div>

            {/* Stats — grey values */}
            <div className="flex flex-wrap gap-6">
              {[
                { icon:'⊣⊢', value:'3',         label:'Exercises'       },
                { icon:'⚡',  value:'Real-time', label:'Feedback'        },
                { icon:'▲',  value:'95%',       label:'Video Accuracy'  },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <span className="text-gray-400 text-sm">{s.icon}</span>
                  <div>
                    <span className="font-black text-gray-900 text-sm">{s.value}</span>
                    <span className="text-gray-400 text-sm ml-1.5">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — hero demo card */}
          <div className="relative">
            <HeroDemoCard/>
            {/* Floating score card */}
            <div className="absolute -bottom-5 -left-5 card px-6 py-4 shadow-xl hidden lg:block">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Session Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900">95</span>
                <span className="text-gray-400 font-semibold">/100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Process</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Up and running in seconds
            </h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              No downloads. No account. Just your camera and you.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n:'01', title:'Open Camera',     desc:'Allow access. Everything stays local — nothing uploaded.' },
              { n:'02', title:'Choose Exercise', desc:'Pick from Bicep Curl, Push-up or Squat. Follow the camera guide.' },
              { n:'03', title:'Get Coaching',    desc:'Instant rep count, form score and real-time coaching cues.' },
            ].map(s => (
              <div key={s.n} className="card p-8 hover:shadow-md transition-shadow">
                <p className="text-5xl font-black text-gray-300 mb-4">{s.n}</p>
                <h3 className="font-bold text-gray-900 text-xl mb-2">{s.title}</h3>
                <p className="text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { v:'3',      l:'Exercises Supported',  s:'Curl · Squat · Push-up'     },
            { v:'30 FPS', l:'Real-Time Analysis',   s:'No perceptible lag'          },
            { v:'100%',   l:'Private By Design',    s:'Zero data leaves your device' },
          ].map(s => (
            <div key={s.l} className="card p-8 text-center hover:shadow-md transition-shadow">
              <p className="text-5xl font-black text-gray-900 mb-2">{s.v}</p>
              <p className="font-bold text-gray-700 mb-1">{s.l}</p>
              <p className="text-sm text-gray-400">{s.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-gray-900 rounded-3xl px-8 py-16 text-center
                        relative overflow-hidden">
          {/* subtle grid decoration */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{backgroundImage:'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
          <div className="relative">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Train smarter.<br/>Move better.
            </h2>
            <p className="text-gray-400 text-lg mb-10">
              No signup. Open camera and start coaching.
            </p>
            <button
              onClick={() => navigate('choose')}
              className="inline-flex items-center gap-3 bg-white hover:bg-gray-100
                         text-gray-900 font-bold text-lg rounded-2xl px-10 py-4
                         shadow-xl transition-all duration-200 hover:scale-[1.02]"
            >
              Start Free Analysis
              <ArrowRight size={20} className="text-gray-700"/>
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-8 text-center text-sm text-gray-400">
        <span className="font-bold text-gray-900 mr-2">Gym Form AI</span>
        AI-powered form analysis · Runs privately in your browser
      </footer>
    </div>
  )
}