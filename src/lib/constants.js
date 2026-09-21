// =============================================================================
// CONSTANTS — shared across feature extraction, form rules, rep counter
// =============================================================================
// ⚠️  JOINT_TRIPLETS must match the Python JOINT_TRIPLETS in Phase 1 exactly.
//     Changing this order will break model predictions.
// =============================================================================

// Angle triplet format: [vertex, pointA, pointB]
// Angle is computed AT vertex, between vectors (vertex→A) and (vertex→B).
// This matches Python: compute_angle(landmarks[a], landmarks[vertex], landmarks[b])
export const JOINT_TRIPLETS = [
  [13, 11, 15],  // 0  left elbow   (shoulder → elbow → wrist)
  [14, 12, 16],  // 1  right elbow
  [11, 23, 13],  // 2  left shoulder  (hip → shoulder → elbow)
  [12, 24, 14],  // 3  right shoulder
  [23, 11, 25],  // 4  left hip       (shoulder → hip → knee)
  [24, 12, 26],  // 5  right hip
  [25, 23, 27],  // 6  left knee      (hip → knee → ankle)
  [26, 24, 28],  // 7  right knee
  [11, 12, 23],  // 8  trunk lean L   (R_shoulder → L_shoulder → L_hip)
  [12, 11, 24],  // 9  trunk lean R   (L_shoulder → R_shoulder → R_hip)
  [15, 13, 19],  // 10 left wrist     (elbow → wrist → L_index)
  [16, 14, 20],  // 11 right wrist
]

// Angle vector indices (for convenience in form rules and rep counter)
export const ANG = {
  LEFT_ELBOW:    0,
  RIGHT_ELBOW:   1,
  LEFT_SHOULDER: 2,
  RIGHT_SHOULDER:3,
  LEFT_HIP:      4,
  RIGHT_HIP:     5,
  LEFT_KNEE:     6,
  RIGHT_KNEE:    7,
  TRUNK_L:       8,
  TRUNK_R:       9,
  LEFT_WRIST:    10,
  RIGHT_WRIST:   11,
}

// MediaPipe BlazePose landmark indices
export const LM = {
  NOSE:            0,
  LEFT_EYE_INNER:  1,
  LEFT_EYE:        2,
  LEFT_EYE_OUTER:  3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE:       5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR:        7,
  RIGHT_EAR:       8,
  MOUTH_LEFT:      9,
  MOUTH_RIGHT:     10,
  LEFT_SHOULDER:   11,
  RIGHT_SHOULDER:  12,
  LEFT_ELBOW:      13,
  RIGHT_ELBOW:     14,
  LEFT_WRIST:      15,
  RIGHT_WRIST:     16,
  LEFT_PINKY:      17,
  RIGHT_PINKY:     18,
  LEFT_INDEX:      19,
  RIGHT_INDEX:     20,
  LEFT_THUMB:      21,
  RIGHT_THUMB:     22,
  LEFT_HIP:        23,
  RIGHT_HIP:       24,
  LEFT_KNEE:       25,
  RIGHT_KNEE:      26,
  LEFT_ANKLE:      27,
  RIGHT_ANKLE:     28,
  LEFT_HEEL:       29,
  RIGHT_HEEL:      30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX:32,
}

// Skeleton connections to draw (pairs of landmark indices)
export const POSE_CONNECTIONS = [
  // Shoulders
  [LM.LEFT_SHOULDER,  LM.RIGHT_SHOULDER],
  // Left arm
  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW],
  [LM.LEFT_ELBOW,     LM.LEFT_WRIST],
  // Right arm
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
  [LM.RIGHT_ELBOW,    LM.RIGHT_WRIST],
  // Torso
  [LM.LEFT_SHOULDER,  LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP,       LM.RIGHT_HIP],
  // Left leg
  [LM.LEFT_HIP,   LM.LEFT_KNEE],
  [LM.LEFT_KNEE,  LM.LEFT_ANKLE],
  // Right leg
  [LM.RIGHT_HIP,  LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  // Feet
  [LM.LEFT_ANKLE,  LM.LEFT_HEEL],
  [LM.LEFT_ANKLE,  LM.LEFT_FOOT_INDEX],
  [LM.RIGHT_ANKLE, LM.RIGHT_HEEL],
  [LM.RIGHT_ANKLE, LM.RIGHT_FOOT_INDEX],
]

// Exercise class definitions (must match Python CLASS_NAMES order)
export const EXERCISES = [
  {
    id:       'bicep_curl',
    classIdx: 0,
    label:    'Bicep Curl',
    emoji:    '💪',
    cameraHint: 'Stand side-on to camera. Full body visible.',
  },
  {
    id:       'push_up',
    classIdx: 1,
    label:    'Push-up',
    emoji:    '🏋️',
    cameraHint: 'Camera at your side at floor level. Full body in frame.',
  },
  {
    id:       'squat',
    classIdx: 2,
    label:    'Squat',
    emoji:    '🦵',
    cameraHint: 'Stand side-on to camera. Full body visible.',
  },
]

// Model / feature dimensions (must match Phase 1 + Phase 2 config)
export const MODEL_CONFIG = {
  SEQ_LEN:    30,    // frames per inference window
  N_FEATURES: 210,   // 99 landmarks + 12 angles + 99 velocity
  N_CLASSES:  3,
  PRED_EVERY: 5,     // run inference every N frames (smooths CPU load)
  SMOOTH_K:   10,    // prediction history length for majority vote
  MIN_CONF:   0.60,  // min softmax confidence to display prediction
}
