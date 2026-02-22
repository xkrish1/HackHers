"use client";

import { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

type Stats = {
  activeSec: number;
  idleSec: number;
  status: "ACTIVE" | "IDLE";
};

const IDLE_GRACE_MS = 2000; // must be "no face" for 2s before counting idle

export default function CameraActiveIdle() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<Stats>({ activeSec: 0, idleSec: 0, status: "IDLE" });

  const detectorRef = useRef<FaceDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const lastTickRef = useRef<number>(0);
  const lastFaceSeenRef = useRef<number>(0);
  const lastDetectTsMsRef = useRef<number>(-1);

  async function start() {
    if (running) return;
    setStats({ activeSec: 0, idleSec: 0, status: "IDLE" });
    setRunning(true);
  }

  function stop() {
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;

    let cancelled = false;

    const setup = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      detectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        },
        runningMode: "VIDEO",
      });

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      if (!videoRef.current) return;
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play();

      lastTickRef.current = performance.now();
      lastFaceSeenRef.current = 0;
      lastDetectTsMsRef.current = -1;

      const loop = () => {
        if (cancelled || !running) return;
        const video = videoRef.current;
        const detector = detectorRef.current;
        if (!video || !detector) return;

        const now = performance.now();
        const dt = now - (lastTickRef.current || now);
        lastTickRef.current = now;
        const videoReady =
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0;
        let faceFound = false;
        if (videoReady) {
          try {
            const rawTsMs = Math.max(0, Math.floor(video.currentTime * 1000));
            const tsMs = Math.max(rawTsMs, lastDetectTsMsRef.current + 1);
            lastDetectTsMsRef.current = tsMs;
            const res = detector.detectForVideo(video, tsMs);
            faceFound = (res.detections?.length ?? 0) > 0;
          } catch {
            // ignore per-frame errors
          }
        }

        if (faceFound) lastFaceSeenRef.current = now;

        const inIdle =
          !faceFound &&
          lastFaceSeenRef.current > 0 &&
          now - lastFaceSeenRef.current > IDLE_GRACE_MS;

        setStats((prev) => {
          const addSec = dt / 1000;
          const activeSec = prev.activeSec + (inIdle ? 0 : addSec);
          const idleSec = prev.idleSec + (inIdle ? addSec : 0);
          return {
            activeSec: Math.round(activeSec),
            idleSec: Math.round(idleSec),
            status: inIdle ? "IDLE" : "ACTIVE",
          };
        });

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    };

    setup().catch((e) => {
      console.error(e);
      setRunning(false);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      detectorRef.current?.close();
      detectorRef.current = null;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [running]);

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Camera Active vs Idle</h3>
        {!running ? (
          <button className="px-3 py-1 rounded bg-black text-white" onClick={start}>
            Start
          </button>
        ) : (
          <button className="px-3 py-1 rounded bg-gray-700 text-white" onClick={stop}>
            Stop
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Simple proxy: <strong>Active = face detected</strong>, <strong>Idle = no face for {IDLE_GRACE_MS / 1000}s</strong>. Opt-in. No video stored.
      </p>

      <div className="grid md:grid-cols-2 gap-3 items-start">
        <video ref={videoRef} className="w-full rounded bg-black" muted playsInline />
        <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-2">
          <div>
            Status:{" "}
            <span className={stats.status === "ACTIVE" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
              {stats.status}
            </span>
          </div>
          <div>Active time: <b>{stats.activeSec}s</b></div>
          <div>Idle time: <b>{stats.idleSec}s</b></div>
        </div>
      </div>
    </div>
  );
}
