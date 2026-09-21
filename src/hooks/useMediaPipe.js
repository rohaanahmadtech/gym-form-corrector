// =============================================================================
// useMediaPipe — MediaPipe Tasks Vision PoseLandmarker
// =============================================================================
//
// Uses @mediapipe/tasks-vision (Tasks API, v0.10.x) — the same API used in
// Phase 1 preprocessing (MediaPipe 1.0.1).
//
// WASM files are loaded from CDN (no local install needed).
// First load: ~5 MB download, then cached by the browser.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

export function useMediaPipe() {
  const landmarkerRef = useRef(null)
  const [status, setStatus] = useState('idle')   // idle | loading | ready | error
  const [error,  setError]  = useState(null)

  // Load the pose landmarker once on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setStatus('loading')

        const vision = await FilesetResolver.forVisionTasks(WASM_CDN)

        const lm = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',   // falls back to CPU automatically if GPU unavailable
          },
          runningMode:               'VIDEO',
          numPoses:                  1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence:  0.5,
          minTrackingConfidence:      0.5,
        })

        if (!cancelled) {
          landmarkerRef.current = lm
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[MediaPipe] Load error:', err)
          setError(err.message ?? 'MediaPipe failed to load')
          setStatus('error')
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  /**
   * Detect pose in a single video frame.
   *
   * Call inside a requestAnimationFrame loop.
   * The timestamp MUST monotonically increase between calls (use performance.now()).
   *
   * @param  {HTMLVideoElement} videoEl
   * @param  {number}           timestampMs
   * @returns {Array<{x,y,z,visibility}>|null}  33 landmarks or null if no pose
   */
  const detect = useCallback((videoEl, timestampMs) => {
    const lm = landmarkerRef.current
    if (!lm || !videoEl || videoEl.readyState < 2) return null

    try {
      const result = lm.detectForVideo(videoEl, timestampMs)
      if (result.landmarks && result.landmarks.length > 0) {
        return result.landmarks[0]   // Array of 33 {x, y, z, visibility}
      }
    } catch (err) {
      // detectForVideo can throw if the frame is not ready; ignore silently
    }
    return null
  }, [])

  return { detect, status, error }
}
