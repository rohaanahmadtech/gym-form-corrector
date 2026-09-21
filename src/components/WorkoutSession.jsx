// =============================================================================
// WorkoutSession — fixed version
// Key fixes:
//   1. Hooks called ONCE here only (removed from App.jsx)
//   2. exercise stored in ref (no stale-closure bug in tick)
//   3. tick is created once with stable deps
//   4. Debug panel shows live angles + buffer status
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMediaPipe }     from '../hooks/useMediaPipe.js'
import { useExerciseModel } from '../hooks/useExerciseModel.js'
import {
  extractFeatures,
  checkVisibility,
  computeJointAngles,
} from '../lib/featureExtraction.js'
import { checkForm, FormErrorFilter, selectTopCue } from '../lib/formRules.js'
import { createCounter }    from '../lib/repCounter.js'
import { EXERCISES, MODEL_CONFIG, ANG } from '../lib/constants.js'
import CameraCanvas         from './CameraCanvas.jsx'
import ExerciseSelector     from './ExerciseSelector.jsx'
import MetricsPanel         from './MetricsPanel.jsx'
import FeedbackPanel        from './FeedbackPanel.jsx'
import LoadingScreen        from './LoadingScreen.jsx'

const { SEQ_LEN, PRED_EVERY, SMOOTH_K, MIN_CONF } = MODEL_CONFIG
const CLASS_NAMES = ['Bicep Curl', 'Push-up', 'Squat']

export default function WorkoutSession() {
  // ── Hooks (single instance each) ──
  const { detect: mpDetect, status: mpStatus, error: mpError }       = useMediaPipe()
  const { predict: tfPredict, status: modelStatus, error: modelError } = useExerciseModel()

  // ── Refs — values the tick loop reads without triggering re-render ──
  const videoRef       = useRef(null)
  const canvasRef      = useRef(null)
  const frameBufferRef = useRef([])      // (30, 210) ring buffer
  const prevNormLmRef  = useRef(null)    // prev frame normalised landmarks
  const predHistRef    = useRef([])      // last SMOOTH_K prediction indices
  const frameCountRef  = useRef(0)
  const rafRef         = useRef(null)
  const timerRef       = useRef(null)
  const counterRef     = useRef(null)
  const errorFilterRef = useRef(new FormErrorFilter())
  const isRunningRef   = useRef(false)   // readable inside tick without closure
  const exerciseRef    = useRef(null)    // readable inside tick without closure

  // ── UI state ──
  const [exercise,     setExercise]    = useState(null)
  const [isRunning,    setIsRunning]   = useState(false)
  const [camError,     setCamError]    = useState(null)
  const [repCount,     setRepCount]    = useState(0)
  const [phase,        setPhase]       = useState(null)
  const [detectedEx,   setDetectedEx]  = useState(null)
  const [confidence,   setConfidence]  = useState(0)
  const [allProbs,     setAllProbs]    = useState([0, 0, 0])
  const [formCue,      setFormCue]     = useState(null)
  const [warning,      setWarning]     = useState(null)
  const [elapsed,      setElapsed]     = useState(0)
  const [showDebug,    setShowDebug]   = useState(true)   // visible by default
  // Debug state — updated every frame
  const [debugInfo, setDebugInfo] = useState({
    bufferSize: 0,
    poseDetected: false,
    elbowAngle: 0,
    kneeAngle: 0,
    rawState: 'EXTENDED',
  })

  // Keep refs in sync with state
  useEffect(() => {
    exerciseRef.current = exercise
  }, [exercise])

  // ── Camera helpers ──
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      setCamError(`Camera error: ${err.message}`)
    }
  }, [])

  const stopCamera = useCallback(() => {
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  // ── Main inference tick ──
  // Created ONCE — reads exercise from exerciseRef (not closure)
  const tick = useCallback(() => {
    if (!isRunningRef.current) return

    const video = videoRef.current
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    const ts  = performance.now()
    const rawLm = mpDetect(video, ts)

    // Visibility gate
    const ex  = exerciseRef.current
    const vis = checkVisibility(rawLm, ex?.id)
    if (!vis.ok) {
      setWarning(vis.message)
      canvasRef.current?.updateSkeleton(null, false)
      setDebugInfo(d => ({ ...d, poseDetected: false }))
      rafRef.current = requestAnimationFrame(tick)
      return
    }
    setWarning(null)

    // Feature extraction
    const { featureVec, normLm } = extractFeatures(rawLm, prevNormLmRef.current)
    prevNormLmRef.current = normLm

    // Ring buffer
    frameBufferRef.current.push(featureVec)
    if (frameBufferRef.current.length > SEQ_LEN) frameBufferRef.current.shift()
    const bufSize = frameBufferRef.current.length

    // Joint angles for rep counting + form rules
    const angles = computeJointAngles(normLm)
    const elbowAngle = ((angles[ANG.LEFT_ELBOW] || 0) + (angles[ANG.RIGHT_ELBOW] || 0)) / 2
    const kneeAngle  = ((angles[ANG.LEFT_KNEE]  || 0) + (angles[ANG.RIGHT_KNEE]  || 0)) / 2

    // TF.js prediction — runs every PRED_EVERY frames once buffer is full
    const fc = frameCountRef.current
    if (bufSize === SEQ_LEN && fc % PRED_EVERY === 0) {
      // Fire-and-forget (async) — guarded by runningRef in useExerciseModel
      tfPredict([...frameBufferRef.current]).then(probs => {
        if (!probs) return
        setAllProbs(probs)
        const argmax = probs.indexOf(Math.max(...probs))
        predHistRef.current.push(argmax)
        if (predHistRef.current.length > SMOOTH_K) predHistRef.current.shift()

        // Majority vote
        const freq = [0, 0, 0]
        predHistRef.current.forEach(i => freq[i]++)
        const majority = freq.indexOf(Math.max(...freq))
        const conf     = probs[majority]

        setConfidence(conf)
        setDetectedEx(conf >= MIN_CONF ? EXERCISES[majority] : null)
      })
    }

    // Rep counting
    let hasError = false
    if (counterRef.current && ex) {
      const { repCompleted, phase: newPhase } = counterRef.current.update(angles)
      if (repCompleted) setRepCount(c => c + 1)
      setPhase(newPhase)

      // Form rules
      const rawErrors    = checkForm(ex.id, normLm, angles)
      const stableErrors = errorFilterRef.current.filter(rawErrors)
      const topCue       = selectTopCue(stableErrors)
      setFormCue(topCue)
      hasError = stableErrors.length > 0
    }

    canvasRef.current?.updateSkeleton(rawLm, hasError)
    frameCountRef.current++

    setDebugInfo({
      bufferSize:   bufSize,
      poseDetected: true,
      elbowAngle:   Math.round(elbowAngle),
      kneeAngle:    Math.round(kneeAngle),
      rawState:     counterRef.current?.state ?? '—',
    })

    rafRef.current = requestAnimationFrame(tick)
  }, [mpDetect, tfPredict])  // stable — exercise read via ref

  // ── Session start / stop ──
  const handleStart = useCallback(async () => {
    const ex = exerciseRef.current
    if (!ex) return
    await startCamera()
    frameBufferRef.current = []
    prevNormLmRef.current  = null
    predHistRef.current    = []
    frameCountRef.current  = 0
    counterRef.current     = createCounter(ex.id)
    errorFilterRef.current = new FormErrorFilter()
    setRepCount(0)
    setPhase(null)
    setFormCue(null)
    setWarning(null)
    setDetectedEx(null)
    setConfidence(0)
    setAllProbs([0, 0, 0])
    setElapsed(0)
    isRunningRef.current = true
    setIsRunning(true)
  }, [startCamera])

  const handleStop = useCallback(() => {
    isRunningRef.current = false
    cancelAnimationFrame(rafRef.current)
    clearInterval(timerRef.current)
    stopCamera()
    setIsRunning(false)
    setPhase(null)
    setWarning(null)
  }, [stopCamera])

  // Start/stop RAF loop
  useEffect(() => {
    if (isRunning) {
      rafRef.current = requestAnimationFrame(tick)
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(timerRef.current)
    }
  }, [isRunning, tick])

  useEffect(() => () => stopCamera(), [stopCamera])

  // ── Loading / error screen ──
  const allReady = mpStatus === 'ready' && modelStatus === 'ready'
  if (!allReady) {
    return (
      <LoadingScreen
        mpStatus={mpStatus}     modelStatus={modelStatus}
        mpError={mpError}       modelError={modelError}
      />
    )
  }

  const canStart = exercise !== null

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto p-4">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">🏋️ AI Gym Assistant</h1>
        <p className="text-xs text-gray-500 mt-1">
          Exercise Classification · Rep Counting · Form Feedback
        </p>
      </div>

      {/* Exercise selector */}
      <ExerciseSelector
        selected={exercise}
        onSelect={ex => { if (!isRunning) setExercise(ex) }}
        disabled={isRunning}
      />

      {/* Camera + skeleton */}
      <div className="relative w-full bg-black rounded-2xl overflow-hidden"
           style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted playsInline autoPlay
        />
        <CameraCanvas ref={canvasRef} videoRef={videoRef} isRunning={isRunning} />

        {/* Top-left: detected exercise */}
        {isRunning && detectedEx && (
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur
                          rounded-full px-3 py-1 text-xs font-medium text-white border border-white/10">
            {detectedEx.emoji} {detectedEx.label}
          </div>
        )}

        {/* Top-right: form status */}
        {isRunning && (
          <div className={`absolute top-3 right-3 bg-black/70 backdrop-blur
                           rounded-full px-3 py-1 text-xs font-medium border
                           ${formCue
                             ? 'text-red-300 border-red-500/50'
                             : 'text-green-300 border-green-500/50'}`}>
            {formCue ? '⚠ Check form' : '✓ Good form'}
          </div>
        )}

        {/* Camera off overlay */}
        {!isRunning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="text-gray-400 text-sm">Camera off</p>
          </div>
        )}

        {camError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <p className="text-red-400 text-sm text-center">{camError}</p>
          </div>
        )}
      </div>

      {/* Metrics */}
      {isRunning && (
        <MetricsPanel
          repCount={repCount}
          phase={phase}
          confidence={confidence}
          detectedExercise={detectedEx}
          elapsedSeconds={elapsed}
        />
      )}

      {/* Form feedback */}
      <FeedbackPanel cue={formCue} warning={warning} isRunning={isRunning} />

      {/* Start / Stop */}
      <button
        onClick={isRunning ? handleStop : handleStart}
        disabled={!canStart && !isRunning}
        className={[
          'w-full py-4 rounded-2xl text-base font-semibold transition-all',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          isRunning
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gym-accent hover:bg-blue-500 text-white',
        ].join(' ')}
      >
        {isRunning ? '⏹ Stop Session' : '▶ Start Session'}
      </button>

      {/* Debug panel toggle */}
      <button
        onClick={() => setShowDebug(d => !d)}
        className="text-xs text-gray-600 hover:text-gray-400 underline text-center"
      >
        {showDebug ? 'Hide' : 'Show'} debug info
      </button>

      {/* ── DEBUG PANEL ── */}
      {showDebug && (
        <div className="bg-gym-surface border border-gym-border rounded-xl p-4
                        font-mono text-xs text-gray-400 space-y-1">
          <p className="text-gray-300 font-semibold mb-2">Debug Panel</p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-gray-500">MediaPipe</span>
            <span className={mpStatus === 'ready' ? 'text-green-400' : 'text-yellow-400'}>
              {mpStatus}
            </span>

            <span className="text-gray-500">TF.js Model</span>
            <span className={modelStatus === 'ready' ? 'text-green-400' : 'text-yellow-400'}>
              {modelStatus}
            </span>

            <span className="text-gray-500">Pose detected</span>
            <span className={debugInfo.poseDetected ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.poseDetected ? 'yes' : 'no'}
            </span>

            <span className="text-gray-500">Buffer</span>
            <span className={debugInfo.bufferSize === SEQ_LEN ? 'text-green-400' : 'text-yellow-400'}>
              {debugInfo.bufferSize} / {SEQ_LEN} frames
              {debugInfo.bufferSize < SEQ_LEN ? ' (filling…)' : ' ✓ full'}
            </span>

            <span className="text-gray-500">Elbow angle</span>
            <span className="text-white">{debugInfo.elbowAngle}°</span>

            <span className="text-gray-500">Knee angle</span>
            <span className="text-white">{debugInfo.kneeAngle}°</span>

            <span className="text-gray-500">Counter state</span>
            <span className="text-white">{debugInfo.rawState}</span>

            <span className="text-gray-500">Confidence</span>
            <span className="text-white">{Math.round(confidence * 100)}%</span>

            <span className="text-gray-500">Raw probs</span>
            <span className="text-white">
              [{allProbs.map(p => (p * 100).toFixed(0) + '%').join(', ')}]
            </span>

            <span className="text-gray-500 col-span-2 mt-1">
              [curl%, pushup%, squat%]
            </span>
          </div>

          {/* Threshold reminder */}
          {isRunning && exercise && (
            <div className="mt-3 pt-3 border-t border-gym-border text-gray-500">
              {exercise.id === 'bicep_curl' && (
                <p>Curl: elbow &lt; 75° = contracted · &gt; 140° = extended</p>
              )}
              {exercise.id === 'squat' && (
                <p>Squat: knee &lt; 110° = depth · &gt; 155° = standing</p>
              )}
              {exercise.id === 'push_up' && (
                <p>Push-up: elbow &lt; 110° = bottom · &gt; 145° = top</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status row */}
      <div className="flex gap-2 text-xs text-gray-600 justify-center">
        <span className={mpStatus === 'ready' ? 'text-green-600' : 'text-yellow-600'}>
          MediaPipe: {mpStatus}
        </span>
        <span>·</span>
        <span className={modelStatus === 'ready' ? 'text-green-600' : 'text-yellow-600'}>
          Model: {modelStatus}
        </span>
      </div>

      {/* Scope note */}
      <p className="text-xs text-gray-600 text-center leading-relaxed px-2">
        ⚠️ Identifies exercises and provides angle-based coaching hints only.
        Not medical advice. Not a substitute for a qualified trainer.
      </p>
    </div>
  )
}