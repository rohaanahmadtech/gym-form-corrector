// =============================================================================
// REP COUNTER — Y-Position based (works from ANY camera angle)
// =============================================================================
// Root cause of previous failure:
//   Joint angles computed from 2D MediaPipe landmarks are unreliable
//   from a front camera — most of the squat/pushup movement is in the
//   Z-axis (depth), invisible in 2D projection.
//
// New approach: track the Y-position of a key landmark in image space.
//   Bicep curl → wrist Y position (wrist moves UP during curl)
//   Squat      → hip  Y position (hips  move DOWN during squat)
//   Push-up    → shoulder Y position (shoulders move DOWN during pushup)
//
// Y-position changes are always clearly visible regardless of camera angle.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// Core counter class — detects oscillation in a Y-position signal
// ─────────────────────────────────────────────────────────────────────────────
class YPositionCounter {
  constructor({ getLandmarkY, actionGoesDown, threshold, minRepMs = 600 }) {
    //  getLandmarkY(rawLm) → number (0–1, MediaPipe image space)
    //  actionGoesDown: true  = the "action" is body going DOWN (squat, pushup)
    //                  false = the "action" is limb going UP   (bicep curl)
    //  threshold: minimum Y movement (fraction of image height) to detect a rep

    this.getLandmarkY  = getLandmarkY
    this.actionGoesDown = actionGoesDown
    this.threshold     = threshold
    this.minRepMs      = minRepMs

    this.count       = 0
    this.phase       = 'neutral'
    this.state       = 'INIT'
    this._history    = []
    this._extreme    = null   // most extreme Y reached in current direction
    this._lastRepMs  = 0
  }

  _smoothY(rawLm) {
    const y = this.getLandmarkY(rawLm)
    if (y == null || isNaN(y)) return null
    this._history.push(y)
    if (this._history.length > 8) this._history.shift()
    return this._history.reduce((s, v) => s + v, 0) / this._history.length
  }

  update(angles, rawLm) {
    const smooth = this._smoothY(rawLm)
    if (smooth == null) return { repCompleted: false, phase: this.phase, currentAngle: 0 }

    let repCompleted = false

    // ── Initialise at first valid reading ──
    if (this.state === 'INIT') {
      this._extreme = smooth
      this.state = this.actionGoesDown ? 'WAITING_DOWN' : 'WAITING_UP'
      return { repCompleted: false, phase: 'neutral', currentAngle: Math.round(smooth * 100) }
    }

    if (this.actionGoesDown) {
      // Squat / Push-up: action = body going DOWN (Y increases)
      if (this.state === 'WAITING_DOWN') {
        this.phase = 'up'
        this._extreme = Math.min(this._extreme, smooth)  // track highest point
        if (smooth > this._extreme + this.threshold) {
          this.state   = 'GOING_DOWN'
          this._extreme = smooth
        }
      }
      else if (this.state === 'GOING_DOWN') {
        this.phase    = 'down'
        this._extreme = Math.max(this._extreme, smooth)  // track lowest point
        // Detect reversal — body starting to come back UP
        if (smooth < this._extreme - this.threshold * 0.45) {
          const now = Date.now()
          if (now - this._lastRepMs > this.minRepMs) {
            this.count++
            repCompleted   = true
            this._lastRepMs = now
          }
          this.state   = 'GOING_UP'
          this.phase   = 'up'
          this._extreme = smooth
        }
      }
      else if (this.state === 'GOING_UP') {
        this.phase = 'up'
        this._extreme = Math.min(this._extreme, smooth)
        if (smooth > this._extreme + this.threshold) {
          this.state = 'GOING_DOWN'
          this.phase = 'down'
          this._extreme = smooth
        } else if (smooth < this._extreme + this.threshold * 0.3) {
          // Back near top — reset to waiting
          this.state    = 'WAITING_DOWN'
          this._extreme = smooth
        }
      }
    }
    else {
      // Bicep curl: action = wrist going UP (Y decreases)
      if (this.state === 'WAITING_UP') {
        this.phase = 'down'
        this._extreme = Math.max(this._extreme, smooth)  // track lowest point (arm down)
        if (smooth < this._extreme - this.threshold) {
          this.state    = 'GOING_UP'
          this._extreme = smooth
        }
      }
      else if (this.state === 'GOING_UP') {
        this.phase    = 'up'
        this._extreme = Math.min(this._extreme, smooth)  // track highest point (arm up)
        // Detect reversal — wrist starting to come back DOWN
        if (smooth > this._extreme + this.threshold * 0.45) {
          const now = Date.now()
          if (now - this._lastRepMs > this.minRepMs) {
            this.count++
            repCompleted    = true
            this._lastRepMs = now
          }
          this.state    = 'GOING_DOWN'
          this.phase    = 'down'
          this._extreme = smooth
        }
      }
      else if (this.state === 'GOING_DOWN') {
        this.phase    = 'down'
        this._extreme = Math.max(this._extreme, smooth)
        if (smooth < this._extreme - this.threshold) {
          this.state = 'GOING_UP'
          this.phase = 'up'
          this._extreme = smooth
        } else if (smooth > this._extreme - this.threshold * 0.3) {
          // Back near bottom — reset
          this.state    = 'WAITING_UP'
          this._extreme = smooth
        }
      }
    }

    return {
      repCompleted,
      phase:        this.phase,
      currentAngle: Math.round(smooth * 100),  // 0–100 (% of image height)
    }
  }

  reset() {
    this.count      = 0
    this.phase      = 'neutral'
    this.state      = 'INIT'
    this._history   = []
    this._extreme   = null
    this._lastRepMs = 0
    return this
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise-specific factories
// ─────────────────────────────────────────────────────────────────────────────

export function createCounter(exerciseId) {
  switch (exerciseId) {

    case 'bicep_curl':
      // Track average wrist Y — wrist moves UP (Y decreases) when curling
      return new YPositionCounter({
        getLandmarkY: (rawLm) => {
          const l = rawLm?.[15]?.y   // LEFT_WRIST
          const r = rawLm?.[16]?.y   // RIGHT_WRIST
          const vals = [l, r].filter(v => v != null && !isNaN(v))
          return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
        },
        actionGoesDown: false,   // wrist goes UP
        threshold:      0.06,    // must move 6% of image height
      })

    case 'squat':
      // Track average hip Y — hips move DOWN (Y increases) when squatting
      return new YPositionCounter({
        getLandmarkY: (rawLm) => {
          const l = rawLm?.[23]?.y   // LEFT_HIP
          const r = rawLm?.[24]?.y   // RIGHT_HIP
          const vals = [l, r].filter(v => v != null && !isNaN(v))
          return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
        },
        actionGoesDown: true,    // hips go DOWN
        threshold:      0.04,    // squats need less threshold (smaller movement)
      })

    case 'push_up':
      // Track average shoulder Y — shoulders move DOWN (Y increases) when descending
      return new YPositionCounter({
        getLandmarkY: (rawLm) => {
          const l = rawLm?.[11]?.y   // LEFT_SHOULDER
          const r = rawLm?.[12]?.y   // RIGHT_SHOULDER
          const vals = [l, r].filter(v => v != null && !isNaN(v))
          return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
        },
        actionGoesDown: true,    // shoulders go DOWN
        threshold:      0.05,
      })

    default:
      return null
  }
}

// Meter display config (now shows Y-position not angles)
export const COUNTER_CONFIG = {
  bicep_curl: { label: 'Wrist Position',    unit: '%', LOW: 30, HIGH: 70, note: 'Wrist moves UP during curl' },
  squat:      { label: 'Hip Position',      unit: '%', LOW: 40, HIGH: 70, note: 'Hips move DOWN during squat' },
  push_up:    { label: 'Shoulder Position', unit: '%', LOW: 20, HIGH: 60, note: 'Shoulders move DOWN during pushup' },
}