// =============================================================================
// FORM RULES — rule-based analysis using MediaPipe landmarks + joint angles
// =============================================================================
//
// SCOPE REMINDER:
//   The GRU model classifies WHICH exercise is being performed.
//   Form feedback below is rule-based and independent of the model.
//   Rules operate directly on normalised landmarks and joint angles
//   computed in real time. They do NOT use the trained model weights.
//
// Rules are intentionally conservative (high threshold) to avoid
// false positives. A wrong "bad form" cue is worse than missing one.
//
// Each check function returns:
//   { id, message, severity }  if the rule is violated
//   null                       if the movement looks fine or is uncertain
// =============================================================================

import { ANG, LM } from './constants.js'

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Return average of two values (handles undefined gracefully). */
const avg = (a, b) => (a + b) / 2

/** Euclidean distance between two 2D points. */
const dist2d = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

// ---------------------------------------------------------------------------
// Bicep Curl rules
// Camera should be at the side. Key joints: shoulders, elbows, wrists, hips.
// All landmarks are hip-centred + torso-scaled (normLm).
// ---------------------------------------------------------------------------

/**
 * @param  {Array<{x,y,z}>} normLm - 33 normalised landmarks
 * @param  {number[]}        angles - 12 joint angles
 * @returns {Array<{id,message,severity}>} - violations (may be empty)
 */
export function checkBicepCurlForm(normLm, angles) {
  const errors = []

  // Rule 1: Elbow drift
  // In hip-centred coords, the elbows should stay close to the torso.
  // Lateral drift (x-axis) > 0.35 torso-lengths signals momentum use.
  const leftElbowDrift  = Math.abs(normLm[LM.LEFT_ELBOW].x)
  const rightElbowDrift = Math.abs(normLm[LM.RIGHT_ELBOW].x)
  if (avg(leftElbowDrift, rightElbowDrift) > 0.38) {
    errors.push({
      id:       'ELBOW_DRIFT',
      message:  'Keep elbows tucked to your sides.',
      severity: 'warning',
    })
  }

  // Rule 2: Torso sway / body English
  // The shoulder midpoint should stay centred over the hip midpoint.
  // Large x-displacement means the person is swinging with their back.
  const shoulderMidX = avg(normLm[LM.LEFT_SHOULDER].x, normLm[LM.RIGHT_SHOULDER].x)
  if (Math.abs(shoulderMidX) > 0.22) {
    errors.push({
      id:       'TORSO_SWAY',
      message:  'Avoid swinging. Keep your upper body still.',
      severity: 'warning',
    })
  }

  // Rule 3: Shoulder elevation
  // Shoulders rising (y decreasing in image space, y increasing in
  // hip-centred inverted coords) signals compensatory deltoid use.
  const shoulderRise = avg(normLm[LM.LEFT_SHOULDER].y, normLm[LM.RIGHT_SHOULDER].y)
  // In hip-centred normalised coords, resting shoulder y ≈ 0.9–1.0
  // Shoulder rise > 0.15 above rest = shrugging
  if (shoulderRise > 1.15) {
    errors.push({
      id:       'SHOULDER_ELEVATION',
      message:  'Keep your shoulders down and back.',
      severity: 'info',
    })
  }

  // Rule 4: Wrist alignment (wrists should be roughly in line with forearm)
  // Excessive wrist flexion/extension detected by wrist angle < 140°
  const wristAngle = avg(angles[ANG.LEFT_WRIST], angles[ANG.RIGHT_WRIST])
  if (wristAngle < 135 && wristAngle > 0) {
    errors.push({
      id:       'WRIST_BEND',
      message:  'Keep wrists straight — do not flex or curl them.',
      severity: 'info',
    })
  }

  return errors
}

// ---------------------------------------------------------------------------
// Squat rules
// Camera at the side. Key joints: shoulders, hips, knees, ankles.
// ---------------------------------------------------------------------------

export function checkSquatForm(normLm, angles) {
  const errors = []

  // Rule 1: Excessive forward lean (trunk)
  // Shoulder midpoint x-displacement relative to hip midpoint.
  // In a well-executed squat, the torso leans forward slightly,
  // but excessive lean (> 0.5 torso-lengths ahead of hips) is flagged.
  const shoulderMidX = avg(normLm[LM.LEFT_SHOULDER].x, normLm[LM.RIGHT_SHOULDER].x)
  const hipMidX      = avg(normLm[LM.LEFT_HIP].x, normLm[LM.RIGHT_HIP].x)
  const trunkForwardLean = shoulderMidX - hipMidX  // positive = forward in side view

  if (Math.abs(trunkForwardLean) > 0.50) {
    errors.push({
      id:       'EXCESSIVE_LEAN',
      message:  'Keep your chest up. Avoid leaning too far forward.',
      severity: 'warning',
    })
  }

  // Rule 2: Knee symmetry
  // L/R knee angle difference > 20° suggests uneven descent.
  const kneeDiff = Math.abs(angles[ANG.LEFT_KNEE] - angles[ANG.RIGHT_KNEE])
  if (kneeDiff > 20 && angles[ANG.LEFT_KNEE] > 0 && angles[ANG.RIGHT_KNEE] > 0) {
    errors.push({
      id:       'ASYMMETRIC_DESCENT',
      message:  'Both knees should bend equally.',
      severity: 'info',
    })
  }

  // Rule 3: Hip depth cue (incomplete squat — check only when knee is bending)
  // Only fire when the person is near the bottom of the squat
  // (avg knee angle between 90° and 130°, so they're mid-descent).
  const avgKnee = avg(angles[ANG.LEFT_KNEE], angles[ANG.RIGHT_KNEE])
  if (avgKnee > 0 && avgKnee < 140) {
    // Hip y should be close to knee y at squat depth.
    // In hip-centred coords, hip is at origin (y≈0); knee y in side view
    // should be close when at depth. This is a rough check.
    const hipY  = avg(normLm[LM.LEFT_HIP].y,  normLm[LM.RIGHT_HIP].y)
    const kneeY = avg(normLm[LM.LEFT_KNEE].y, normLm[LM.RIGHT_KNEE].y)
    // If hip is still much higher than knee, depth is insufficient.
    // In normalised coords, larger y = lower in the image (camera default).
    if (kneeY - hipY < 0.15 && avgKnee > 105) {
      errors.push({
        id:       'INSUFFICIENT_DEPTH',
        message:  'Go deeper — aim to bring hips below knee level.',
        severity: 'warning',
      })
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Push-up rules
// Camera at the side, low. Key joints: shoulders, elbows, hips, ankles.
// ---------------------------------------------------------------------------

export function checkPushupForm(normLm, angles) {
  const errors = []

  // Rule 1: Hip sag
  // Body should be a straight plank from shoulder to ankle.
  // Compute: hip y relative to the line connecting shoulder and ankle.
  // In normalised hip-centred coords, hip is at origin (y ≈ 0).
  // Shoulders and ankles should be at similar y levels.
  const shoulderY = avg(normLm[LM.LEFT_SHOULDER].y, normLm[LM.RIGHT_SHOULDER].y)
  const ankleY    = avg(normLm[LM.LEFT_ANKLE].y,   normLm[LM.RIGHT_ANKLE].y)
  const hipY      = 0  // hip is the origin in normalised coords

  // Expected hip y = linear interpolation on the shoulder→ankle line
  // but since hip IS the origin, we check if shoulders and ankles are
  // approximately co-linear through the origin.
  // Simple check: shoulder y and ankle y should have the same sign and
  // the hip should not deviate more than 0.25 torso-lengths from this line.
  const expectedHipY = (shoulderY + ankleY) / 2
  const hipDeviation = Math.abs(hipY - expectedHipY)

  if (hipDeviation > 0.28) {
    if (hipY > expectedHipY) {
      // Hip is below the shoulder-ankle line = sagging
      errors.push({
        id:       'HIP_SAG',
        message:  'Keep your hips up — don\'t let them sag.',
        severity: 'warning',
      })
    } else {
      // Hip is above the line = piking
      errors.push({
        id:       'HIP_PIKE',
        message:  'Lower your hips — don\'t push them up.',
        severity: 'warning',
      })
    }
  }

  // Rule 2: Elbow flare
  // Elbows should track close to the body (≈ 45° from torso).
  // Shoulder angle = angle at shoulder between hip and elbow.
  // If shoulder angle is very large, elbows are flaring outward.
  const shoulderAngle = avg(angles[ANG.LEFT_SHOULDER], angles[ANG.RIGHT_SHOULDER])
  if (shoulderAngle > 80 && shoulderAngle > 0) {
    errors.push({
      id:       'ELBOW_FLARE',
      message:  'Keep elbows closer to your body (≈45° angle).',
      severity: 'info',
    })
  }

  return errors
}

// ---------------------------------------------------------------------------
// Router: call the right rule set for the active exercise
// ---------------------------------------------------------------------------

/**
 * Run form checks for the active exercise.
 *
 * @param  {string}           exerciseId  - 'bicep_curl' | 'push_up' | 'squat'
 * @param  {Array<{x,y,z}>}  normLm      - 33 normalised landmarks
 * @param  {number[]}         angles      - 12 joint angles
 * @returns {Array<{id,message,severity}>}  list of current violations
 */
export function checkForm(exerciseId, normLm, angles) {
  if (!normLm || normLm.length < 33) return []
  switch (exerciseId) {
    case 'bicep_curl': return checkBicepCurlForm(normLm, angles)
    case 'squat':      return checkSquatForm(normLm, angles)
    case 'push_up':    return checkPushupForm(normLm, angles)
    default:           return []
  }
}

// ---------------------------------------------------------------------------
// Error persistence filter
// Only fire a cue if the same error appears in >= MIN_FRAMES of the
// last WINDOW frames. Prevents single-frame false positives.
// ---------------------------------------------------------------------------

const WINDOW    = 12   // look-back window
const MIN_HITS  = 5    // must appear in at least 5 of the last 12 frames

/**
 * Maintains a sliding window of error lists.
 * Returns only errors that have persisted long enough to show the user.
 */
export class FormErrorFilter {
  constructor() {
    this._history = []   // Array of error-id sets
  }

  /** Feed current frame's raw errors; returns filtered, stable errors. */
  filter(currentErrors) {
    // Add current error ids to history
    const currentIds = new Set(currentErrors.map(e => e.id))
    this._history.push(currentIds)
    if (this._history.length > WINDOW) this._history.shift()

    // Count occurrences of each error id across the window
    const counts = {}
    for (const frameSet of this._history) {
      for (const id of frameSet) {
        counts[id] = (counts[id] ?? 0) + 1
      }
    }

    // Only include errors that cross the MIN_HITS threshold
    const stableIds = new Set(
      Object.entries(counts).filter(([, c]) => c >= MIN_HITS).map(([id]) => id)
    )
    return currentErrors.filter(e => stableIds.has(e.id))
  }

  reset() { this._history = [] }
}

// ---------------------------------------------------------------------------
// Cue prioritisation: show one message at a time, most severe first
// ---------------------------------------------------------------------------

const SEVERITY_ORDER = { warning: 0, info: 1 }

/**
 * Select the single highest-priority feedback cue from a list of errors.
 * Returns null if no errors.
 */
export function selectTopCue(errors) {
  if (!errors.length) return null
  return [...errors].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  )[0]
}
