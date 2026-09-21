// =============================================================================
// FEATURE EXTRACTION — JavaScript port of Phase 1 Python pipeline
// =============================================================================
//
// This file must produce IDENTICAL output to the Python process_video()
// function. Any difference in feature order or normalisation will cause
// the model to give wrong predictions.
//
// Feature vector layout (210 values per frame):
//   [0   – 98 ] : 33 normalised landmark xyz coordinates  (99 values)
//                  order: [x0,y0,z0, x1,y1,z1, ..., x32,y32,z32]
//   [99  – 110] : 12 joint angles in JOINT_TRIPLETS order (12 values)
//   [111 – 209] : 33 landmark velocity (delta xyz vs prev frame)       (99 values)
//
// Python reference (process_video):
//   flat_lm   = norm_lm.flatten()           → row-major, xyz per point
//   angles    = compute_joint_angles()
//   velocity  = (norm_lm - prev_norm).flatten()
//   feature   = np.concatenate([flat_lm, angles, velocity])
// =============================================================================

import { JOINT_TRIPLETS } from './constants.js'

// ---------------------------------------------------------------------------
// Hip-centred, torso-scaled normalisation
// Matches Python normalize_landmarks()
// ---------------------------------------------------------------------------

/**
 * Normalise 33 landmarks to be invariant to camera distance and user height.
 *
 * @param  {Array<{x,y,z}>} rawLm  - 33 landmark objects from MediaPipe
 * @returns {Array<{x,y,z}>}        - 33 normalised landmark objects
 */
export function normalizeLandmarks(rawLm) {
  // Hip midpoint (landmarks 23 and 24)
  const hipMid = {
    x: (rawLm[23].x + rawLm[24].x) / 2,
    y: (rawLm[23].y + rawLm[24].y) / 2,
    z: (rawLm[23].z + rawLm[24].z) / 2,
  }

  // Shoulder midpoint (landmarks 11 and 12)
  const shoulderMid = {
    x: (rawLm[11].x + rawLm[12].x) / 2,
    y: (rawLm[11].y + rawLm[12].y) / 2,
    z: (rawLm[11].z + rawLm[12].z) / 2,
  }

  // Torso length = Euclidean distance between hip_mid and shoulder_mid
  const dx = shoulderMid.x - hipMid.x
  const dy = shoulderMid.y - hipMid.y
  const dz = shoulderMid.z - hipMid.z
  let torsoLen = Math.sqrt(dx * dx + dy * dy + dz * dz)
  if (torsoLen < 1e-6) torsoLen = 1.0  // safety: avoid division by zero

  // Translate to hip-centred, scale by torso length
  return rawLm.map(lm => ({
    x: (lm.x - hipMid.x) / torsoLen,
    y: (lm.y - hipMid.y) / torsoLen,
    z: (lm.z - hipMid.z) / torsoLen,
  }))
}

// ---------------------------------------------------------------------------
// Joint angle calculation
// Matches Python compute_angle(a, b, c) — angle AT b
// ---------------------------------------------------------------------------

/**
 * Interior angle in degrees at point b, formed by the path a→b→c.
 *
 * @param {{x,y,z}} a
 * @param {{x,y,z}} b  - vertex
 * @param {{x,y,z}} c
 * @returns {number} angle in degrees [0, 180]
 */
export function computeAngle(a, b, c) {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z }

  const normBa = Math.sqrt(ba.x * ba.x + ba.y * ba.y + ba.z * ba.z)
  const normBc = Math.sqrt(bc.x * bc.x + bc.y * bc.y + bc.z * bc.z)

  if (normBa < 1e-6 || normBc < 1e-6) return 0.0

  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z
  const cosA = Math.max(-1.0, Math.min(1.0, dot / (normBa * normBc)))
  return Math.acos(cosA) * (180 / Math.PI)
}

/**
 * Compute all 12 joint angles from normalised landmarks.
 * Order matches JOINT_TRIPLETS exactly.
 *
 * @param  {Array<{x,y,z}>} normLm - 33 normalised landmarks
 * @returns {number[]} 12 angles in degrees
 */
export function computeJointAngles(normLm) {
  return JOINT_TRIPLETS.map(([vertex, a, b]) => {
    if (Math.max(vertex, a, b) >= normLm.length) return 0.0
    return computeAngle(normLm[a], normLm[vertex], normLm[b])
  })
}

// ---------------------------------------------------------------------------
// Full 210-feature vector for one frame
// ---------------------------------------------------------------------------

/**
 * Build the 210-feature vector for one frame. Matches Python feature_vec.
 *
 * @param  {Array<{x,y,z,visibility}>} rawLm     - 33 raw MediaPipe landmarks
 * @param  {Array<{x,y,z}>|null}       prevNormLm - normalised landmarks from
 *                                                   the previous frame, or null
 *                                                   for the first frame
 * @returns {{ featureVec: number[], normLm: Array<{x,y,z}> }}
 *           featureVec: Float32Array(210) ready for the model
 *           normLm: the normalised landmarks (pass as prevNormLm next frame)
 */
export function extractFeatures(rawLm, prevNormLm) {
  // 1. Normalise
  const normLm = normalizeLandmarks(rawLm)   // Array of 33 {x,y,z}

  // 2. Flatten landmarks → 99 values
  //    Order: [x0,y0,z0, x1,y1,z1, ..., x32,y32,z32]
  //    Matches Python: norm_lm.flatten() with row-major order
  const flatLm = normLm.flatMap(p => [p.x, p.y, p.z])   // 99 values

  // 3. Joint angles → 12 values
  const angles = computeJointAngles(normLm)               // 12 values

  // 4. Velocity: frame-to-frame delta → 99 values
  //    Matches Python: (norm_lm - prev_norm).flatten()
  let velocity
  if (prevNormLm !== null && prevNormLm !== undefined) {
    velocity = normLm.flatMap((p, i) => [
      p.x - prevNormLm[i].x,
      p.y - prevNormLm[i].y,
      p.z - prevNormLm[i].z,
    ])
  } else {
    velocity = new Array(99).fill(0)  // first frame has no prior
  }

  // 5. Concatenate: 99 + 12 + 99 = 210
  const featureVec = [...flatLm, ...angles, ...velocity]

  return { featureVec, normLm }
}

// ---------------------------------------------------------------------------
// Scaler normalisation (Z-score using training set statistics)
// ---------------------------------------------------------------------------

/**
 * Apply Z-score normalisation using the saved scaler parameters.
 * Must be applied AFTER extractFeatures, BEFORE feeding to the model.
 *
 * @param  {number[]} featureVec   - raw 210-feature vector
 * @param  {number[]} scalerMean   - 210-length mean from scaler_params.json
 * @param  {number[]} scalerStd    - 210-length std from scaler_params.json
 * @returns {number[]}              - normalised 210-feature vector
 */
export function applyScaler(featureVec, scalerMean, scalerStd) {
  return featureVec.map((v, i) => {
    const std = scalerStd[i] < 1e-8 ? 1.0 : scalerStd[i]
    return (v - scalerMean[i]) / std
  })
}

// ---------------------------------------------------------------------------
// Visibility check — guard against frames where key joints are hidden
// ---------------------------------------------------------------------------

/**
 * Check whether the critical joints for a given exercise are visible.
 *
 * @param  {Array<{visibility}>} rawLm
 * @param  {string} exerciseId  - 'bicep_curl' | 'push_up' | 'squat' | null
 * @returns {{ ok: boolean, message: string }}
 */
export function checkVisibility(rawLm, exerciseId) {
  if (!rawLm || rawLm.length < 33) {
    return { ok: false, message: 'No pose detected. Step into frame.' }
  }

  const JOINTS_BY_EXERCISE = {
    bicep_curl: [11, 12, 13, 14, 15, 16, 23, 24],  // upper body + hips
    push_up:    [11, 12, 13, 14, 23, 24, 25, 26, 27, 28],
    squat:      [11, 12, 23, 24, 25, 26, 27, 28],
    default:    [11, 12, 23, 24],  // at minimum: shoulders + hips
  }

  const key = JOINTS_BY_EXERCISE[exerciseId] ?? JOINTS_BY_EXERCISE.default
  const avgVis = key.reduce((s, i) => s + (rawLm[i]?.visibility ?? 0), 0) / key.length

  if (avgVis < 0.50) {
    return {
      ok: false,
      message: `Key joints not visible (${Math.round(avgVis * 100)}%). Move back from camera.`,
    }
  }
  return { ok: true, message: '' }
}
