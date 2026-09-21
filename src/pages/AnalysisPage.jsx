import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, StopCircle, Shield, Warning, CheckCircle, CaretRight, Barbell, CircleNotch, VideoCamera, ArrowUp, ArrowDown } from '../components/Icons.jsx'
import { saveSession } from './ProgressPage.jsx'
import { useMediaPipe }     from '../hooks/useMediaPipe.js'
import { useExerciseModel } from '../hooks/useExerciseModel.js'
import { extractFeatures, checkVisibility, computeJointAngles } from '../lib/featureExtraction.js'
import { checkForm, FormErrorFilter, selectTopCue } from '../lib/formRules.js'
import { createCounter, COUNTER_CONFIG } from '../lib/repCounter.js'
import { EXERCISES, MODEL_CONFIG, ANG, POSE_CONNECTIONS } from '../lib/constants.js'

const { SEQ_LEN, PRED_EVERY, SMOOTH_K, MIN_CONF } = MODEL_CONFIG

function ScoreGauge({ score, size = 110 }) {
  const r = (size-12)/2, circ = 2*Math.PI*r
  const pct = Math.max(0,Math.min(100,score||0))
  const color = pct>=80?'#22c55e':pct>=60?'#f59e0b':'#ef4444'
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#f1f5f9" strokeWidth="10" fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="10" fill="none"
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ*(1-pct/100)}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:'stroke-dashoffset 0.4s ease'}}/>
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize="18" fontWeight="900" fill="#111827">{pct}%</text>
    </svg>
  )
}

function SkeletonCanvas({ videoRef, landmarksRef, hasError }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const video = videoRef?.current, canvas = canvasRef.current
    if (!video||!canvas) return
    let rafId
    function draw() {
      rafId = requestAnimationFrame(draw)
      if (canvas.width!==video.videoWidth&&video.videoWidth) canvas.width=video.videoWidth
      if (canvas.height!==video.videoHeight&&video.videoHeight) canvas.height=video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0,0,canvas.width,canvas.height)
      const lm = landmarksRef.current
      if (!lm||lm.length<33) return
      const W=canvas.width,H=canvas.height,color=hasError?'#ef4444':'#22c55e'
      ctx.strokeStyle=color; ctx.lineWidth=2.5
      for (const [a,b] of POSE_CONNECTIONS) {
        const pa=lm[a],pb=lm[b]
        if (!pa||!pb||(pa.visibility||0)<0.3||(pb.visibility||0)<0.3) continue
        ctx.beginPath(); ctx.moveTo(pa.x*W,pa.y*H); ctx.lineTo(pb.x*W,pb.y*H); ctx.stroke()
      }
      ctx.fillStyle=color
      const KEY=new Set([11,12,13,14,15,16,23,24,25,26,27,28])
      for (let i=0;i<33;i++) {
        const p=lm[i]; if (!p||(p.visibility||0)<0.3) continue
        ctx.beginPath(); ctx.arc(p.x*W,p.y*H,KEY.has(i)?5:3,0,Math.PI*2); ctx.fill()
      }
    }
    draw(); return () => cancelAnimationFrame(rafId)
  },[videoRef,landmarksRef,hasError])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{objectFit:'cover'}}/>
}

export default function AnalysisPage({ exercise, navigate }) {
  const { detect:mpDetect, status:mpStatus, error:mpError } = useMediaPipe()
  const { predict:tfPredict, status:modelStatus, error:modelError } = useExerciseModel()

  const videoRef=useRef(null), landmarksRef=useRef(null), frameBufferRef=useRef([])
  const prevNormLmRef=useRef(null), predHistRef=useRef([]), frameCountRef=useRef(0)
  const rafRef=useRef(null), timerRef=useRef(null), counterRef=useRef(null)
  const errorFilterRef=useRef(new FormErrorFilter()), isRunningRef=useRef(false)
  const repHistRef=useRef([]), currentRepErrRef=useRef(new Set())

  const [isRunning,setIsRunning]=useState(false)
  const [isPaused,setIsPaused]=useState(false)
  const [camError,setCamError]=useState(null)
  const [repCount,setRepCount]=useState(0)
  const [phase,setPhase]=useState(null)
  const [detectedEx,setDetectedEx]=useState(null)
  const [confidence,setConfidence]=useState(0)
  const [formCue,setFormCue]=useState(null)
  const [warning,setWarning]=useState(null)
  const [formScore,setFormScore]=useState(100)
  const [hasError,setHasError]=useState(false)
  const [elapsed,setElapsed]=useState(0)
  const [currentAngle,setCurrentAngle]=useState(0)
  const [counterState,setCounterState]=useState('INIT')

  const allReady = mpStatus==='ready'&&modelStatus==='ready'
  const anyError = mpStatus==='error'||modelStatus==='error'
  const computeFormScore=()=>{ const h=repHistRef.current; return h.length?Math.round(h.filter(r=>!r.hasError).length/h.length*100):100 }
  const startCamera=useCallback(async()=>{ try { const s=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false}); if(videoRef.current){videoRef.current.srcObject=s;await videoRef.current.play()} } catch(e){setCamError(`Camera: ${e.message}`)} },[])
  const stopCamera=useCallback(()=>{ videoRef.current?.srcObject?.getTracks().forEach(t=>t.stop()); if(videoRef.current)videoRef.current.srcObject=null },[])

  const tick=useCallback(()=>{
    if (!isRunningRef.current) return
    const video=videoRef.current
    if (!video||video.readyState<2){rafRef.current=requestAnimationFrame(tick);return}
    const rawLm=mpDetect(video,performance.now())
    const vis=checkVisibility(rawLm,exercise?.id)
    if (!vis.ok){setWarning(vis.message);landmarksRef.current=null;rafRef.current=requestAnimationFrame(tick);return}
    setWarning(null); landmarksRef.current=rawLm
    const {featureVec,normLm}=extractFeatures(rawLm,prevNormLmRef.current)
    prevNormLmRef.current=normLm
    frameBufferRef.current.push(featureVec)
    if (frameBufferRef.current.length>SEQ_LEN) frameBufferRef.current.shift()
    const fc=frameCountRef.current
    if (frameBufferRef.current.length===SEQ_LEN&&fc%PRED_EVERY===0) {
      tfPredict([...frameBufferRef.current]).then(probs=>{
        if (!probs) return
        const argmax=probs.indexOf(Math.max(...probs))
        predHistRef.current.push(argmax)
        if (predHistRef.current.length>SMOOTH_K) predHistRef.current.shift()
        const freq=[0,0,0]; predHistRef.current.forEach(i=>freq[i]++)
        const maj=freq.indexOf(Math.max(...freq))
        setConfidence(probs[maj])
        setDetectedEx(probs[maj]>=MIN_CONF?EXERCISES[maj]:null)
      })
    }
    const angles=computeJointAngles(normLm)
    if (counterRef.current&&exercise) {
      const {repCompleted,phase:p,currentAngle:ca}=counterRef.current.update(angles,rawLm)
      setPhase(p); if (ca!==undefined) setCurrentAngle(ca); setCounterState(counterRef.current.state)
      if (repCompleted){const hasErr=currentRepErrRef.current.size>0;repHistRef.current.push({rep:repCount+1,hasError:hasErr});currentRepErrRef.current=new Set();setRepCount(c=>c+1);setFormScore(computeFormScore())}
    }
    const rawErr=checkForm(exercise?.id,normLm,angles)
    const stable=errorFilterRef.current.filter(rawErr)
    stable.forEach(e=>currentRepErrRef.current.add(e.id))
    setFormCue(selectTopCue(stable)); setHasError(stable.length>0)
    frameCountRef.current++; rafRef.current=requestAnimationFrame(tick)
  },[mpDetect,tfPredict,exercise])

  const handleStart=useCallback(async()=>{
    if (!exercise) return
    await startCamera()
    frameBufferRef.current=[]; prevNormLmRef.current=null; predHistRef.current=[]; frameCountRef.current=0
    counterRef.current=createCounter(exercise.id); errorFilterRef.current=new FormErrorFilter()
    repHistRef.current=[]; currentRepErrRef.current=new Set()
    setRepCount(0);setPhase(null);setFormCue(null);setWarning(null);setDetectedEx(null)
    setConfidence(0);setFormScore(100);setElapsed(0);setHasError(false);setCurrentAngle(0);setCounterState('INIT')
    isRunningRef.current=true; setIsRunning(true)
  },[exercise,startCamera])

  const handlePause=useCallback(()=>{ const n=!isPaused;setIsPaused(n);isRunningRef.current=!n;if(!n)rafRef.current=requestAnimationFrame(tick) },[isPaused,tick])
  const handleEnd=useCallback(()=>{
    isRunningRef.current=false; cancelAnimationFrame(rafRef.current); clearInterval(timerRef.current); stopCamera(); setIsRunning(false)
    const rh=repHistRef.current
    const sd={exercise:exercise?.label,exerciseId:exercise?.id,totalReps:rh.length,correctReps:rh.filter(r=>!r.hasError).length,needsWork:rh.filter(r=>r.hasError).length,formScore:computeFormScore(),duration:elapsed}
    saveSession(sd)
    navigate('results',{results:sd})
  },[exercise,elapsed,navigate,stopCamera])

  useEffect(()=>{ if(isRunning&&!isPaused){rafRef.current=requestAnimationFrame(tick);timerRef.current=setInterval(()=>setElapsed(e=>e+1),1000)} return()=>{cancelAnimationFrame(rafRef.current);clearInterval(timerRef.current)} },[isRunning,isPaused,tick])
  useEffect(()=>()=>stopCamera(),[stopCamera])

  const mins=Math.floor(elapsed/60), secs=String(elapsed%60).padStart(2,'0')

  if (!allReady) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card p-10 text-center max-w-sm w-full">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Barbell size={30} className="text-gray-700"/>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Starting AI Analysis</h2>
        <p className="text-gray-400 text-sm mb-8">Loading pose detection and exercise model</p>
        <div className="space-y-3">
          {[{label:'MediaPipe Pose',status:mpStatus,err:mpError},{label:'Exercise Model',status:modelStatus,err:modelError}].map(item=>(
            <div key={item.label} className="flex items-center justify-between bg-gray-50 rounded-xl p-3.5">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              {item.err?<span className="text-xs text-red-500">Failed</span>:item.status==='ready'?<CheckCircle size={17} className="text-brand-500"/>:<CircleNotch size={17} className="text-brand-500 animate-spin"/>}
            </div>
          ))}
        </div>
        {anyError&&<p className="text-xs text-red-500 mt-4">Open browser console (F12) for details.</p>}
      </div>
    </div>
  )

  const formLabel = formScore>=90?'Excellent Form':formScore>=75?'Great Form':formScore>=60?'Good Form':'Needs Work'
  const formColor = formScore>=80?'text-brand-600':formScore>=60?'text-yellow-600':'text-red-500'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
            <button className="hover:text-gray-700" onClick={()=>navigate('choose')}>Exercises</button>
            <CaretRight size={12}/><span className="text-gray-700 font-medium">{exercise?.label}</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Live Form Analysis</h1>
          <p className="text-gray-400 text-sm mt-0.5">Get real-time feedback on your form</p>
        </div>
        {isRunning&&(
          <div className="hidden sm:flex items-center gap-2 border border-brand-200 bg-brand-50 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"/>
            <span className="text-brand-700 text-xs font-bold">AI Coach Active</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* Camera */}
        <div className="card overflow-hidden">
          <div className="relative bg-gray-950" style={{aspectRatio:'4/3'}}>
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay/>
            <SkeletonCanvas videoRef={videoRef} landmarksRef={landmarksRef} hasError={hasError}/>
            {/* Badges */}
            {isRunning&&(
              <>
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-3 py-1.5 shadow">
                  <span className="text-xs font-bold text-gray-900">{exercise?.label}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"/>
                  <span className="text-xs font-bold text-brand-600">LIVE</span>
                </div>
                <div className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-sm ${hasError?'bg-red-50/90 text-red-700 border border-red-200':'bg-brand-50/90 text-brand-700 border border-brand-200'}`}>
                  {hasError?<Warning size={12}/>:<CheckCircle size={12}/>}
                  {hasError?'Check form':'Good form'}
                </div>
              </>
            )}
            {warning&&isRunning&&(
              <div className="absolute bottom-16 left-3 right-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <Warning size={14} className="text-amber-600 mt-0.5 flex-shrink-0"/>
                  <p className="text-xs text-amber-800 font-medium">{warning}</p>
                </div>
              </div>
            )}
            {isRunning&&landmarksRef.current&&!warning&&(
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400"/>
                <span className="text-brand-400 text-xs font-medium">Body detected</span>
              </div>
            )}
            {!isRunning&&(
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90">
                <VideoCamera size={40} className="text-gray-600 mb-3"/>
                <p className="text-gray-400 text-sm">Camera starts when you begin</p>
              </div>
            )}
            {camError&&<div className="absolute inset-0 flex items-center justify-center bg-gray-950/95 p-6"><p className="text-red-400 text-sm text-center">{camError}</p></div>}
          </div>

          {/* Bottom capability badges */}
          <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-2">
            {['Camera On','Pose Tracking','Real-time AI','Accurate Reps'].map(b=>(
              <span key={b} className={`text-xs font-semibold px-3 py-1 rounded-full border ${isRunning?'bg-brand-50 text-brand-700 border-brand-200':'bg-gray-50 text-gray-400 border-gray-200'}`}>{b}</span>
            ))}
          </div>

          {/* Controls */}
          <div className="p-4 flex gap-3">
            {isRunning?(
              <>
                <button onClick={handlePause} className="btn-outline flex-1 py-2.5 text-sm justify-center">
                  {isPaused?<><Play size={14} className="text-brand-600"/>Resume</>:<><Pause size={14}/>Pause</>}
                </button>
                <button onClick={handleEnd} className="flex-1 py-2.5 rounded-full text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center gap-2">
                  <StopCircle size={14}/>End Session
                </button>
              </>
            ):(
              <button onClick={handleStart} className="btn-dark w-full py-3 text-base justify-center">
                <Play size={16} className="text-white"/>Start Analysis
              </button>
            )}
          </div>
        </div>

        {/* Right metrics panel */}
        <div className="flex flex-col gap-4">
          {/* Form score */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Exercise</p>
                <p className="font-black text-gray-900 text-lg">{exercise?.label}</p>
                {isRunning&&detectedEx&&(
                  <p className={`text-[10px] font-semibold mt-0.5 ${detectedEx.id===exercise?.id?'text-brand-500':'text-amber-500'}`}>
                    {detectedEx.id===exercise?.id?'AI confirmed':`AI sees: ${detectedEx.label}`}
                  </p>
                )}
              </div>
              <ScoreGauge score={formScore}/>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Form Score</p>
              <p className={`text-sm font-bold mt-0.5 ${formColor}`}>{formLabel}</p>
            </div>
          </div>

          {/* Rep + Phase + Time */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {label:'Rep',   value:repCount,            color:'text-brand-600'},
              {label:'Phase', value:phase==='up'?<ArrowUp size={18} className="mx-auto"/>:phase==='down'?<ArrowDown size={18} className="mx-auto"/>:'—', color:'text-gray-700'},
              {label:'Time',  value:`${mins}:${secs}`,   color:'text-gray-700'},
            ].map(m=>(
              <div key={m.label} className="card p-3 text-center">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{m.label}</p>
                <div className={`text-xl font-black ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Confidence */}
          {isRunning&&(
            <div className="card p-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">Model confidence</span>
                <span className="font-bold text-gray-700">{Math.round(confidence*100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{width:`${Math.round(confidence*100)}%`}}/>
              </div>
            </div>
          )}

          {/* Feedback */}
          <div className="card p-4 flex-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Live Feedback</p>
            {!isRunning?(
              <p className="text-sm text-gray-400">Feedback appears here during your set.</p>
            ):warning?(
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <Warning size={15} className="text-amber-500 mt-0.5 flex-shrink-0"/>
                <p className="text-xs font-medium text-amber-800">{warning}</p>
              </div>
            ):formCue?(
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3">
                <Warning size={15} className="text-red-500 mt-0.5 flex-shrink-0"/>
                <p className="text-xs font-semibold text-red-800">{formCue.message}</p>
              </div>
            ):(
              <div className="flex items-start gap-2.5 bg-brand-50 border border-brand-100 rounded-xl p-3">
                <CheckCircle size={15} className="text-brand-500 mt-0.5 flex-shrink-0"/>
                <p className="text-xs font-semibold text-brand-800">Great form — keep it up!</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Shield size={11} className="text-brand-500"/>Analysis runs privately in your browser
          </div>
        </div>
      </div>
    </div>
  )
}