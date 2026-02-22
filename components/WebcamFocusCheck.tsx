"use client"

import { useEffect, useRef, useState } from "react"
import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from "@mediapipe/tasks-vision"

export default function WebcamFocusCheck() {
  const focusVideoRef = useRef<HTMLVideoElement | null>(null)
  const pulseVideoRef = useRef<HTMLVideoElement | null>(null)

  const detectorRef = useRef<FaceLandmarker | null>(null)
  const animRef = useRef<number | null>(null)
  const lastEngagedRef = useRef(0)
  const lastTickRef = useRef(0)
  const lastDetectTsMsRef = useRef(-1)
  const lastVideoTimeRef = useRef(-1)
  const lastDetectCallRef = useRef(0)
  const detectWarnedRef = useRef(false)
  const activeSecRef = useRef(0)
  const idleSecRef = useRef(0)
  const activeAccumRef = useRef(0)
  const idleAccumRef = useRef(0)
  const lastUiUpdateRef = useRef(0)

  const runningRef = useRef(false)
  const windowOpenRef = useRef(false)

  const [showFocusWindow, setShowFocusWindow] = useState(false)
  const [running, setRunning] = useState(false)
  const [activeStatus, setActiveStatus] = useState<"ACTIVE" | "IDLE">("IDLE")
  const [activeSec, setActiveSec] = useState(0)
  const [idleSec, setIdleSec] = useState(0)

  const [pulse, setPulse] = useState<{
    heartRate?: number
    breathingRate?: number
    confidence?: number
    stressIndex?: number
  } | null>(null)
  const [pulseMsg, setPulseMsg] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      stopFocusChecker()
      stopPulsePreview()
      detectorRef.current?.close()
      detectorRef.current = null
    }
  }, [])

  function stopPulsePreview() {
    const pulseVideo = pulseVideoRef.current
    if (pulseVideo && pulseVideo.srcObject) {
      const stream = pulseVideo.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      pulseVideo.srcObject = null
    }
  }

  function resetTimers() {
    lastEngagedRef.current = 0
    lastTickRef.current = 0
    lastDetectTsMsRef.current = -1
    lastVideoTimeRef.current = -1
    lastDetectCallRef.current = 0
    activeSecRef.current = 0
    idleSecRef.current = 0
    activeAccumRef.current = 0
    idleAccumRef.current = 0
    lastUiUpdateRef.current = 0
  }

  function stopFocusChecker() {
    runningRef.current = false
    windowOpenRef.current = false
    setRunning(false)
    resetTimers()

    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }

    const focusVideo = focusVideoRef.current
    if (focusVideo && focusVideo.srcObject) {
      const stream = focusVideo.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      focusVideo.srcObject = null
    }
  }

  async function ensureDetector() {
    if (detectorRef.current) return detectorRef.current

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    )

    detectorRef.current = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "VIDEO",
      numFaces: 1,
    })

    return detectorRef.current
  }

  function runFocusLoop() {
    const video = focusVideoRef.current
    const detector = detectorRef.current
    if (!video || !detector) return

    const IDLE_GRACE_MS = 2000
    const EYE_MIN = 0.42
    const EYE_MAX = 0.58

    const getLandmark = (landmarks: NormalizedLandmark[], idx: number) => landmarks[idx]
    const centerX = (a?: NormalizedLandmark, b?: NormalizedLandmark) =>
      a && b ? (a.x + b.x) / 2 : null
    const centerY = (a?: NormalizedLandmark, b?: NormalizedLandmark) =>
      a && b ? (a.y + b.y) / 2 : null

    const faceForward = (landmarks?: NormalizedLandmark[]) => {
      if (!landmarks || landmarks.length < 478) return null
      const leftOuter = getLandmark(landmarks, 33)
      const rightOuter = getLandmark(landmarks, 263)
      const noseTip = getLandmark(landmarks, 1)
      if (!leftOuter || !rightOuter || !noseTip) return null
      const leftDist = Math.abs(noseTip.x - leftOuter.x)
      const rightDist = Math.abs(rightOuter.x - noseTip.x)
      if (leftDist <= 0 || rightDist <= 0) return null
      const ratio = leftDist / rightDist
      return ratio > 0.75 && ratio < 1.25
    }

    const eyesOnScreen = (landmarks?: NormalizedLandmark[]) => {
      if (!landmarks || landmarks.length < 478) return null

      const leftOuter = getLandmark(landmarks, 33)
      const leftInner = getLandmark(landmarks, 133)
      const rightOuter = getLandmark(landmarks, 362)
      const rightInner = getLandmark(landmarks, 263)
      const leftIris = getLandmark(landmarks, 468)
      const rightIris = getLandmark(landmarks, 473)
      const leftUpper = getLandmark(landmarks, 159)
      const leftLower = getLandmark(landmarks, 145)
      const rightUpper = getLandmark(landmarks, 386)
      const rightLower = getLandmark(landmarks, 374)

      const leftCenter = centerX(leftOuter, leftInner)
      const rightCenter = centerX(rightOuter, rightInner)
      if (leftCenter === null || rightCenter === null) return null

      const leftSpan = Math.max(0.0001, Math.abs(leftInner.x - leftOuter.x))
      const rightSpan = Math.max(0.0001, Math.abs(rightOuter.x - rightInner.x))

      const leftRatio = leftIris ? Math.abs(leftIris.x - leftOuter.x) / leftSpan : null
      const rightRatio = rightIris ? Math.abs(rightIris.x - rightInner.x) / rightSpan : null

      const leftEyeCenterY = centerY(leftUpper, leftLower)
      const rightEyeCenterY = centerY(rightUpper, rightLower)
      const leftEyeSpanY = leftUpper && leftLower ? Math.max(0.0001, Math.abs(leftUpper.y - leftLower.y)) : null
      const rightEyeSpanY = rightUpper && rightLower ? Math.max(0.0001, Math.abs(rightUpper.y - rightLower.y)) : null

      const leftYR = leftIris && leftEyeCenterY !== null && leftEyeSpanY
        ? Math.abs(leftIris.y - leftEyeCenterY) / leftEyeSpanY
        : null
      const rightYR = rightIris && rightEyeCenterY !== null && rightEyeSpanY
        ? Math.abs(rightIris.y - rightEyeCenterY) / rightEyeSpanY
        : null

      if (leftRatio === null || rightRatio === null) return null
      if (leftYR === null || rightYR === null) return null

      const withinX = leftRatio >= EYE_MIN && leftRatio <= EYE_MAX && rightRatio >= EYE_MIN && rightRatio <= EYE_MAX
      const withinY = leftYR <= 0.45 && rightYR <= 0.45
      return withinX && withinY
    }

    const loop = () => {
      if (!runningRef.current || !windowOpenRef.current) return

      try {
        const now = performance.now()
        const prevTick = lastTickRef.current || now
        const dtSec = (now - prevTick) / 1000
        lastTickRef.current = now

        const videoReady =
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0

        let faceFound = false
        let engaged: boolean | null = null

        if (videoReady) {
          try {
            const nowMs = performance.now()
            if (nowMs - lastDetectCallRef.current >= 80) {
              const currentTime = video.currentTime
              if (currentTime > lastVideoTimeRef.current) {
                lastVideoTimeRef.current = currentTime
                const rawTsMs = Math.max(0, Math.floor(currentTime * 1000))
                const monotonicTsMs = Math.max(rawTsMs, lastDetectTsMsRef.current + 1)
                lastDetectTsMsRef.current = monotonicTsMs
                lastDetectCallRef.current = nowMs
                const result = detector.detectForVideo(video, monotonicTsMs)
                faceFound = (result.faceLandmarks?.length ?? 0) > 0
                const gazeOnScreen = eyesOnScreen(result.faceLandmarks?.[0])
                const headForward = faceForward(result.faceLandmarks?.[0])
                if (gazeOnScreen !== null && headForward !== null) {
                  engaged = gazeOnScreen && headForward
                } else if (gazeOnScreen !== null) {
                  engaged = gazeOnScreen
                } else if (headForward !== null) {
                  engaged = headForward
                } else {
                  engaged = faceFound
                }
              }
            }
          } catch (error) {
            if (!detectWarnedRef.current) {
              console.warn("Face detection skipped for a frame:", error)
              detectWarnedRef.current = true
            }
          }
        }

        if (engaged ?? faceFound) {
          lastEngagedRef.current = now
        }

        const inIdle =
          !(engaged ?? faceFound) &&
          lastEngagedRef.current > 0 &&
          now - lastEngagedRef.current > IDLE_GRACE_MS

        setActiveStatus(inIdle ? "IDLE" : "ACTIVE")
        if (inIdle) {
          idleAccumRef.current += dtSec
        } else {
          activeAccumRef.current += dtSec
        }

        while (idleAccumRef.current >= 1) {
          idleAccumRef.current -= 1
          idleSecRef.current += 1
        }
        while (activeAccumRef.current >= 1) {
          activeAccumRef.current -= 1
          activeSecRef.current += 1
        }

        if (now - lastUiUpdateRef.current >= 250) {
          lastUiUpdateRef.current = now
          setActiveSec(activeSecRef.current)
          setIdleSec(idleSecRef.current)
        }
      } catch {
        // ignore per-frame issues
      }

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
  }

  async function startFocusChecker() {
    if (runningRef.current) return

    setActiveSec(0)
    setIdleSec(0)
    setActiveStatus("IDLE")

    detectWarnedRef.current = false
    resetTimers()
    runningRef.current = true
    windowOpenRef.current = true
    setRunning(true)
    setShowFocusWindow(true)

    try {
      if (
        !navigator ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        stopFocusChecker()
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })

      if (!focusVideoRef.current) {
        stopFocusChecker()
        return
      }

      focusVideoRef.current.srcObject = stream
      await focusVideoRef.current.play()

      await ensureDetector()
      lastTickRef.current = performance.now()
      lastEngagedRef.current = 0

      runFocusLoop()
    } catch (error) {
      console.error(error)
      stopFocusChecker()
      setShowFocusWindow(false)
    }
  }

  function closeFocusWindow() {
    stopFocusChecker()
    setShowFocusWindow(false)
  }

  async function runPulseAnalyzeOnLaptop() {
    setPulseMsg("Recording 3s for pulse analysis…")

    try {
      if (
        !navigator ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        setPulseMsg("Camera unavailable")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      if (pulseVideoRef.current) {
        pulseVideoRef.current.srcObject = stream
        try {
          await pulseVideoRef.current.play()
        } catch {
          // preview is optional
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
      })

      const chunks: BlobPart[] = []
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      const stopped = new Promise<void>((resolve, reject) => {
        recorder.onstop = () => resolve()
        recorder.onerror = (event) => reject(event)
      })

      recorder.start()
      await new Promise((resolve) => setTimeout(resolve, 3000))
      recorder.stop()
      await stopped

      const blob = new Blob(chunks, { type: "video/webm" })
      stream.getTracks().forEach((track) => track.stop())

      const formData = new FormData()
      formData.append("file", blob, "capture.webm")

      const response = await fetch("/api/pulse/analyze", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (!data.ok) {
        setPulseMsg("Pulse analysis failed")
        return
      }

      setPulse({
        heartRate: typeof data.heart_rate === "number" ? data.heart_rate : undefined,
        breathingRate:
          typeof data.breathing_rate === "number" ? data.breathing_rate : undefined,
        confidence: typeof data.confidence === "number" ? data.confidence : undefined,
        stressIndex: typeof data.stress_index === "number" ? data.stress_index : undefined,
      })
      setPulseMsg("Pulse analysis complete")
    } catch (error) {
      console.error(error)
      setPulseMsg("Recording failed")
    } finally {
      stopPulsePreview()
    }
  }

  return (
    <div className="rounded-xl border p-6 text-center">
      <h3 className="font-semibold">Focus Check (Webcam)</h3>
      <p className="text-xs text-muted-foreground">
        Live focus checker in a closeable window with active/idle monitoring.
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          onClick={startFocusChecker}
          className="rounded bg-primary px-4 py-2 text-white"
        >
          Start Focus Checker
        </button>
      </div>

      <video ref={pulseVideoRef} className="hidden" autoPlay playsInline muted />

      {showFocusWindow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-medium">Focus Checker Window</div>
              <button
                onClick={closeFocusWindow}
                className="rounded border px-3 py-1 text-sm text-muted-foreground"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <video
                  ref={focusVideoRef}
                  className="w-full rounded bg-black/10"
                  autoPlay
                  playsInline
                  muted
                />
              </div>

              <div className="p-3 text-left">
                <div className="text-sm font-medium">Monitor</div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activeStatus === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <span className="text-sm font-semibold">
                    {activeStatus}
                  </span>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">Active time</div>
                <div className="text-2xl font-semibold text-foreground">{activeSec}s</div>
                <div className="mt-3 text-sm text-muted-foreground">Idle time</div>
                <div className="text-2xl font-semibold text-foreground">{idleSec}s</div>

                <div className="mt-5 border-t pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium">Pulse (Presage Laptop)</div>
                    <button
                      onClick={runPulseAnalyzeOnLaptop}
                      className="rounded bg-emerald-600 px-3 py-1 text-xs text-white"
                    >
                      Check Heart Rate
                    </button>
                  </div>
                  {pulse ? (
                    <div className="space-y-1 text-sm">
                      <div>
                        HR: <b>{pulse.heartRate ? Math.round(pulse.heartRate) : "--"}</b>
                      </div>
                      <div>
                        BR: <b>{pulse.breathingRate ? Math.round(pulse.breathingRate) : "--"}</b>
                      </div>
                      <div>
                        Stress: <b>{typeof pulse.stressIndex === "number" ? pulse.stressIndex.toFixed(2) : "--"}</b>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No pulse reading yet.</div>
                  )}
                  {pulseMsg && <div className="mt-2 text-xs text-muted-foreground">{pulseMsg}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
