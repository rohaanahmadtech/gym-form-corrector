// =============================================================================
// CameraCanvas — webcam feed + skeleton overlay
// =============================================================================

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { POSE_CONNECTIONS, LM } from '../lib/constants.js'

// Colours for skeleton joints (form-aware colouring applied by parent)
const SKELETON_COLOR_OK  = '#22c55e'   // green  — no form errors
const SKELETON_COLOR_ERR = '#ef4444'   // red    — form error detected
const JOINT_RADIUS       = 5
const LINE_WIDTH         = 2.5

/**
 * Draw the MediaPipe skeleton onto a canvas element.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x,y,z,visibility}>} landmarks  - 33 raw MediaPipe landmarks
 *                                                  (NOT normalised — use image coords)
 * @param {number} w  - canvas width
 * @param {number} h  - canvas height
 * @param {boolean} hasError - if true, draw in red; otherwise green
 */
function drawSkeleton(ctx, landmarks, w, h, hasError) {
  if (!landmarks || landmarks.length < 33) return

  const color = hasError ? SKELETON_COLOR_ERR : SKELETON_COLOR_OK

  ctx.save()
  ctx.lineWidth   = LINE_WIDTH
  ctx.strokeStyle = color
  ctx.fillStyle   = color
  ctx.globalAlpha = 0.85

  // Draw connections
  for (const [a, b] of POSE_CONNECTIONS) {
    const pA = landmarks[a]
    const pB = landmarks[b]
    if (!pA || !pB) continue
    if ((pA.visibility ?? 0) < 0.3 || (pB.visibility ?? 0) < 0.3) continue

    ctx.beginPath()
    ctx.moveTo(pA.x * w, pA.y * h)
    ctx.lineTo(pB.x * w, pB.y * h)
    ctx.stroke()
  }

  // Draw joints (highlight key ones slightly larger)
  const KEY_JOINTS = new Set([
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
    LM.LEFT_ELBOW,    LM.RIGHT_ELBOW,
    LM.LEFT_WRIST,    LM.RIGHT_WRIST,
    LM.LEFT_HIP,      LM.RIGHT_HIP,
    LM.LEFT_KNEE,     LM.RIGHT_KNEE,
    LM.LEFT_ANKLE,    LM.RIGHT_ANKLE,
  ])

  for (let i = 0; i < 33; i++) {
    const p = landmarks[i]
    if (!p || (p.visibility ?? 0) < 0.3) continue
    const r = KEY_JOINTS.has(i) ? JOINT_RADIUS + 1 : JOINT_RADIUS - 1
    ctx.beginPath()
    ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

// ---------------------------------------------------------------------------
// CameraCanvas component
// ---------------------------------------------------------------------------
// Exposes a ref API so the parent WorkoutSession can call:
//   canvasRef.current.updateSkeleton(landmarks, hasError)
// ---------------------------------------------------------------------------

const CameraCanvas = forwardRef(function CameraCanvas(
  { videoRef, isRunning },
  ref
) {
  const canvasRef = useRef(null)

  // Sync canvas size to video on resize
  useEffect(() => {
    const video = videoRef?.current
    if (!video) return

    function syncSize() {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width  = video.videoWidth  || video.clientWidth
      canvas.height = video.videoHeight || video.clientHeight
    }

    video.addEventListener('loadedmetadata', syncSize)
    video.addEventListener('resize', syncSize)
    syncSize()
    return () => {
      video.removeEventListener('loadedmetadata', syncSize)
      video.removeEventListener('resize', syncSize)
    }
  }, [videoRef])

  // Clear canvas when stopped
  useEffect(() => {
    if (!isRunning) {
      const canvas = canvasRef.current
      const ctx    = canvas?.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [isRunning])

  // Imperative handle: parent calls this every frame with new landmarks
  useImperativeHandle(ref, () => ({
    updateSkeleton(landmarks, hasError) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (landmarks) drawSkeleton(ctx, landmarks, canvas.width, canvas.height, hasError)
    },
  }))

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ objectFit: 'cover' }}
      aria-hidden="true"
    />
  )
})

export default CameraCanvas
