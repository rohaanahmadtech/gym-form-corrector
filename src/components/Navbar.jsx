const NAV = ['Home','How It Works','Exercises','Progress']
const NAV_ROUTES = { 'Home':'landing','How It Works':'howitworks','Exercises':'choose','Progress':'progress' }

export default function Navbar({ page, navigate }) {
  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <button onClick={() => navigate('landing')} className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/images/logo.jpeg" alt="Gym Form AI" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-black text-lg text-white tracking-tight">Gym Form <span className="text-brand-500">AI</span></span>
        </button>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(l => {
            const to = NAV_ROUTES[l]
            const active = page === to
            return (
              <button key={l} onClick={() => navigate(to)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${active ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                {l}
              </button>
            )
          })}
        </nav>
        <button onClick={() => navigate('choose')}
          className="btn-dark px-5 py-2 text-sm flex-shrink-0 bg-white !text-gray-900 hover:bg-gray-100 border border-gray-200">
          Start Training &rarr;
        </button>
      </div>
    </header>
  )
}