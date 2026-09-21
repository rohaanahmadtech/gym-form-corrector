// =============================================================================
// Icons.jsx — Self-contained SVG icon library
// Zero npm dependencies. Drop-in replacement for @phosphor-icons/react.
// API: <IconName size={20} className="text-emerald-600" />
// The 'weight' prop is accepted but ignored (kept for API compatibility).
// =============================================================================

const I = ({ size = 20, className = '', fill = 'none', stroke = 'currentColor',
             strokeWidth = 1.75, children }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={stroke}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true"
  >
    {children}
  </svg>
)

// Navigation / arrows
export const ArrowRight = (p) => <I {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></I>
export const ArrowLeft  = (p) => <I {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></I>
export const ArrowUp    = (p) => <I {...p}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/></I>
export const ArrowDown  = (p) => <I {...p}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19,12 12,19 5,12"/></I>
export const CaretRight = (p) => <I {...p} strokeWidth={2}><polyline points="9,18 15,12 9,6"/></I>

export const ArrowCounterClockwise = (p) => (
  <I {...p}>
    <polyline points="1,4 1,10 7,10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
  </I>
)

// Checks / status
export const Check       = (p) => <I {...p} strokeWidth={2.5}><polyline points="20,6 9,17 4,12"/></I>
export const CheckCircle = (p) => <I {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></I>
export const X           = (p) => <I {...p} strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></I>
export const Warning     = (p) => <I {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></I>

// UI controls
export const Play       = (p) => <I {...p} fill="currentColor" stroke="none"><polygon points="5,3 19,12 5,21"/></I>
export const Pause      = (p) => <I {...p} fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></I>
export const StopCircle = (p) => <I {...p}><circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6"/></I>
export const Repeat     = (p) => <I {...p}><polyline points="17,1 21,5 17,9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7,23 3,19 7,15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></I>

// Loading
export const CircleNotch = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round"
       className={className} aria-hidden="true">
    <path d="M12 2a10 10 0 0 1 10 10" opacity="0.4"/>
    <path d="M12 2a10 10 0 0 1 10 10"/>
    <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

// Navigation icons
export const House = (p) => (
  <I {...p}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </I>
)

export const Info = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </I>
)

export const List = (p) => (
  <I {...p}>
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </I>
)

// Fitness / sports
export const Barbell = (p) => (
  <I {...p}>
    <rect x="1"  y="10" width="4" height="4" rx="1"/>
    <rect x="19" y="10" width="4" height="4" rx="1"/>
    <rect x="3"  y="8"  width="3" height="8" rx="0.5"/>
    <rect x="18" y="8"  width="3" height="8" rx="0.5"/>
    <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2"/>
  </I>
)

// Tech / data
export const VideoCamera = (p) => (
  <I {...p}>
    <polygon points="23,7 16,12 23,17"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </I>
)

export const Shield = (p) => (
  <I {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </I>
)

export const Target = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </I>
)

export const Lightning = (p) => (
  <I {...p} fill="currentColor" stroke="none">
    <path d="M13 2L4.09 12.54A1 1 0 0 0 4.83 14H11v8l8.91-10.54A1 1 0 0 0 19.17 10H13V2z"/>
  </I>
)

export const TrendingUp = (p) => (
  <I {...p}>
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
    <polyline points="17,6 23,6 23,12"/>
  </I>
)

export const ChartBar = (p) => (
  <I {...p}>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </I>
)

export const Timer = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9"/>
    <polyline points="12,6 12,12 16,14"/>
  </I>
)

export const Calendar = (p) => (
  <I {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8"  y1="2" x2="8"  y2="6"/>
    <line x1="3"  y1="10" x2="21" y2="10"/>
  </I>
)

export const Repeat2 = Repeat   // alias

// Analysis
export const Brain = (p) => (
  <I {...p}>
    <path d="M9.5 2a2.5 2.5 0 0 1 5 0"/>
    <path d="M14.5 2.5c1.2.7 2 2 2 3.5 0 1-.3 1.9-.8 2.6"/>
    <path d="M9.5 2.5C8.3 3.2 7.5 4.5 7.5 6c0 1 .3 1.9.8 2.6"/>
    <path d="M5 10.5a3.5 3.5 0 0 0 3 6.5"/>
    <path d="M19 10.5a3.5 3.5 0 0 1-3 6.5"/>
    <path d="M7 17c0 2.2 2.2 4 5 4s5-1.8 5-4v-2a5 5 0 0 0-10 0v2z"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
  </I>
)

export const Ruler = (p) => (
  <I {...p}>
    <path d="M5 3l14 14-3.33 3.33a2.36 2.36 0 0 1-3.33 0L3.67 11.33a2.36 2.36 0 0 1 0-3.33z"/>
    <line x1="8"  y1="8"  x2="10" y2="10"/>
    <line x1="11" y1="5"  x2="13" y2="7"/>
    <line x1="14" y1="8"  x2="16" y2="10"/>
    <line x1="5"  y1="11" x2="7"  y2="13"/>
  </I>
)

export const Star = (p) => (
  <I {...p}>
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </I>
)

export const Users = (p) => (
  <I {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </I>
)

export const Sun = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1"  x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1"  y1="12" x2="3"  y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </I>
)