"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function PulsePhonePageInner() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";

  const [hr, setHr] = useState("82");
  const [br, setBr] = useState("16");
  const [msg, setMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [streamActive, setStreamActive] = useState(false)

  useEffect(() => {
    // if token present, attempt to warm up camera preview (ask for permission)
    let mounted = true
    async function startPreview() {
      if (!token) return
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          if (!mounted) {
            s.getTracks().forEach(t => t.stop())
            return
          }
          if (videoRef.current) {
            videoRef.current.srcObject = s
            await videoRef.current.play()
            setStreamActive(true)
          }
        }
      } catch (e) {
        // ignore; user may deny permission
      }
    }
    void startPreview()
    return () => {
      mounted = false
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream
        s.getTracks().forEach(t => t.stop())
      }
    }
  }, [token])

  async function submit() {
    const res = await fetch("/api/pulse/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        heart_rate: Number(hr),
        breathing_rate: Number(br),
      }),
    });

    setMsg(res.ok ? "Uploaded!" : "Failed");
    if (res.ok) {
      setTimeout(() => setMsg(""), 1500);
    }
  }

  return (
    <div className="p-6 space-y-4 max-w-md mx-auto">
      <h1 className="text-lg font-semibold">Pulse Upload</h1>

      <div className="flex flex-col gap-2">
        <label className="text-sm">Token</label>
        <input value={token} readOnly className="w-full rounded border px-2 py-1 bg-secondary/5" />
      </div>

      <div className="rounded border p-3">
        <div className="mb-2 text-sm font-medium">Camera preview</div>
        <div className="flex items-center justify-center">
          <video ref={videoRef} className="w-64 h-40 bg-black/10 rounded" playsInline muted autoPlay />
        </div>
        {!streamActive && (
          <div className="mt-2 text-xs text-muted-foreground">
            Camera inactive or permission denied. On mobile browsers getUserMedia requires a secure context (https) — if the camera prompt doesn't appear try opening the QR URL in a browser that supports camera over LAN or use the fallback capture button below.
          </div>
        )}
        <div className="mt-3 text-center">
          <label className="inline-block rounded bg-secondary/10 px-3 py-1 text-sm cursor-pointer">
            Open camera (fallback)
            <input
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const url = URL.createObjectURL(f)
                // show preview in the video element if possible
                if (videoRef.current) {
                  videoRef.current.srcObject = null
                  videoRef.current.src = url
                  videoRef.current.play().catch(() => {})
                  setStreamActive(true)
                }
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm">Heart Rate (bpm)</label>
          <input value={hr} onChange={e => setHr(e.target.value)} className="w-full rounded border px-2 py-1" />
        </div>
        <div>
          <label className="text-sm">Breathing Rate (rpm)</label>
          <input value={br} onChange={e => setBr(e.target.value)} className="w-full rounded border px-2 py-1" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={submit} className="rounded bg-primary px-3 py-1 text-white">Upload</button>
        <button
          onClick={async () => {
            // Record a short 3s clip from the camera and send to /api/pulse/analyze
            try {
              if (!(navigator && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function')) {
                setMsg('Camera unavailable')
                return
              }
              const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
              // show preview while recording
              if (videoRef.current) {
                videoRef.current.srcObject = stream
                try { await videoRef.current.play() } catch {}
              }

              const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' })
              const chunks: BlobPart[] = []
              recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data) }
              const stopped = new Promise<void>((resolve, reject) => {
                recorder.onstop = () => resolve()
                recorder.onerror = (ev) => reject(ev)
              })
              recorder.start()
              setMsg('Recording 3s...')
              await new Promise((r) => setTimeout(r, 3000))
              recorder.stop()
              await stopped
              const blob = new Blob(chunks, { type: 'video/webm' })
              // stop tracks
              stream.getTracks().forEach(t => t.stop())

              const fd = new FormData()
              fd.append('file', blob, 'capture.webm')
              const res = await fetch('/api/pulse/analyze', { method: 'POST', body: fd })
              const data = await res.json()
              if (!data.ok) {
                setMsg('Analysis failed')
                return
              }
              // populate inputs and auto-upload
              if (typeof data.heart_rate === 'number') setHr(String(Math.round(data.heart_rate)))
              if (typeof data.breathing_rate === 'number') setBr(String(Math.round(data.breathing_rate)))
              setMsg('Analysis complete — uploading...')
              await fetch('/api/pulse/upload', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, heart_rate: Number(data.heart_rate), breathing_rate: Number(data.breathing_rate) })
              })
              setMsg('Uploaded from analysis')
              setTimeout(() => setMsg(''), 2000)
            } catch (err) {
              console.error(err)
              setMsg('Recording failed')
            }
          }}
          className="rounded bg-emerald-600 px-3 py-1 text-white"
        >
          Record 3s & Analyze
        </button>
        <div className="text-sm text-muted-foreground">{msg}</div>
      </div>
    </div>
  );
}

export default function PulsePhonePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading pulse upload...</div>}>
      <PulsePhonePageInner />
    </Suspense>
  )
}
