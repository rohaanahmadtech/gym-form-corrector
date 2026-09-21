// =============================================================================
// useExerciseModel — LayersModel version (GRU-compatible)
// =============================================================================
// Uses tf.loadLayersModel (NOT loadGraphModel).
// save_keras_model() → loadLayersModel() is the correct path for Keras GRU.
// Prediction is simple: model.predict(tensor) — no named inputs needed.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'

export function useExerciseModel() {
  const modelRef   = useRef(null)
  const scalerRef  = useRef(null)
  const runningRef = useRef(false)

  const [status, setStatus] = useState('idle')
  const [error,  setError]  = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setStatus('loading')

        // 1 ── Scaler params
        const scalerRes = await fetch('/scaler_params.json')
        if (!scalerRes.ok) {
          throw new Error(
            `Cannot load scaler_params.json (HTTP ${scalerRes.status}). ` +
            `File must be at: public/scaler_params.json`
          )
        }
        const scaler = await scalerRes.json()
        if (!scaler.mean || !scaler.std) {
          throw new Error('scaler_params.json must have "mean" and "std" arrays')
        }
        if (scaler.mean.length !== 210) {
          throw new Error(
            `scaler mean length is ${scaler.mean.length}, expected 210. ` +
            `Make sure you are using scaler_params.json from Phase 1.`
          )
        }
        console.log('[Model] scaler_params.json ✓')

        // 2 ── Load LayersModel (exported via save_keras_model)
        //      This handles Keras GRU layers correctly in the browser.
        const model = await tf.loadLayersModel('/model/model.json')
        console.log('[Model] loadLayersModel ✓  input:', model.inputs[0]?.shape)

        // 3 ── Warm-up (compile WebGL shaders, check output shape)
        const dummy  = tf.zeros([1, 30, 210])
        const warmup = model.predict(dummy)
        const wData  = await (Array.isArray(warmup) ? warmup[0] : warmup).data()
        dummy.dispose()
        if (Array.isArray(warmup)) warmup.forEach(t => t.dispose())
        else warmup.dispose()

        if (wData.length !== 3) {
          throw new Error(
            `Model output length is ${wData.length}, expected 3. ` +
            `Check that the correct model file is loaded.`
          )
        }
        console.log('[Model] warm-up ✓  output length:', wData.length)

        if (!cancelled) {
          modelRef.current  = model
          scalerRef.current = { mean: scaler.mean, std: scaler.std }
          setStatus('ready')
          console.log('[Model] Ready ✓')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[Model] Load error:', err)
          setError(err.message)
          setStatus('error')
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  // ── Inference ──────────────────────────────────────────────────────────────
  const predict = useCallback(async (frameBuffer) => {
    if (!modelRef.current || !scalerRef.current) return null
    if (runningRef.current) return null      // previous call still running
    if (frameBuffer.length !== 30) return null

    runningRef.current = true
    let inputTensor  = null
    let outputTensor = null

    try {
      const { mean, std } = scalerRef.current

      // Z-score normalisation — must match Phase 1 scaler exactly
      const normalised = frameBuffer.map(frame =>
        frame.map((v, i) => {
          const s = std[i] < 1e-8 ? 1.0 : std[i]
          return (v - mean[i]) / s
        })
      )

      inputTensor = tf.tensor3d([normalised], [1, 30, 210], 'float32')

      // LayersModel.predict() — straightforward, no named inputs needed
      outputTensor = modelRef.current.predict(inputTensor)

      // Handle unlikely case of array output
      const outT   = Array.isArray(outputTensor) ? outputTensor[0] : outputTensor
      const probs  = await outT.data()   // Float32Array(3): [curl, pushup, squat]

      return Array.from(probs)

    } catch (err) {
      console.error('[Model] Inference error:', err)
      return null
    } finally {
      inputTensor?.dispose()
      if (Array.isArray(outputTensor)) outputTensor.forEach(t => t.dispose())
      else outputTensor?.dispose()
      runningRef.current = false
    }
  }, [])

  return { predict, status, error }
}