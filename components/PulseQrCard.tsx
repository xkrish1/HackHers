"use client"

import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Latest =
  | { found: false }
  | {
      found: true;
      heart_rate: number;
      breathing_rate: number;
      confidence: number;
      stress_index: number;
      break_recommended: boolean;
      created_at: number;
    };

const getBaseUrl = () => {
  // prefer explicit env var (build-time) but fall back to runtime origin when available
  if (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_BASE_URL_FOR_QR) {
    return process.env.NEXT_PUBLIC_BASE_URL_FOR_QR
  }
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return "http://192.168.1.23:3000"
}

export default function PulseQrCard() {
  const [token, setToken] = useState<string | null>(null);
  const [latest, setLatest] = useState<Latest>({ found: false });
  const [polling, setPolling] = useState(false);
  const [health, setHealth] = useState<{ ok: boolean; mode?: string } | null>(null)

  const qrUrl = useMemo(() => {
    const base = getBaseUrl()
    return token ? `${base}/pulse?token=${encodeURIComponent(token)}` : "";
  }, [token]);

  async function generateQr() {
    const res = await fetch("/api/pulse/session", {
      method: "POST",
    });
    const data = await res.json();
    setToken(data.token);
    setPolling(true);
  }

  async function openLaptopPulse() {
    const res = await fetch("/api/pulse/session", { method: "POST" })
    const data = await res.json()
    const t = data.token
    setToken(t)
    setPolling(true)
    window.open(`/pulse?token=${encodeURIComponent(t)}`, "_blank", "noopener,noreferrer")
  }

  async function simulatePulse() {
    // create a session token then upload a synthetic reading
    const res = await fetch("/api/pulse/session", { method: "POST" })
    const data = await res.json()
    const t = data.token
    // random-ish values
    const hr = 60 + Math.round(Math.random() * 30)
    const br = 12 + Math.round(Math.random() * 6)
    await fetch("/api/pulse/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: t, heart_rate: hr, breathing_rate: br }),
    })
    // show QR/poller for this token so dev can see outcome
    setToken(t)
    setPolling(true)
  }

  useEffect(() => {
    if (!token || !polling) return;

    const id = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/pulse/latest?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (data.found) {
          setLatest(data as Latest);
          setPolling(false);
        }
      } catch (err) {
        // ignore transient errors
      }
    }, 1000);

    return () => clearInterval(id);
  }, [token, polling]);

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/pulse/health")
        const data = await res.json()
        if (!mounted) return
        setHealth({ ok: Boolean(data.ok), mode: data.mode })
      } catch {
        if (!mounted) return
        setHealth({ ok: false })
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex justify-between">
        <h3 className="font-semibold">Pulse Check (Laptop Camera)</h3>
        <button
          onClick={openLaptopPulse}
          className="px-3 py-1 bg-black text-white rounded"
        >
          Start on Laptop
        </button>
      </div>

      <div className="text-xs text-muted-foreground">
        {health?.ok
          ? `Analyzer ready${health.mode ? ` (${health.mode})` : ""}`
          : "Analyzer unavailable, will fallback to simulated values."}
      </div>

      <p className="text-xs text-gray-500">Opt-in. No video stored. Not medical advice.</p>

      <div className="flex items-center gap-2">
        <button onClick={generateQr} className="px-3 py-1 rounded border text-xs">
          Use Phone via QR Instead
        </button>
      </div>

      {token && <QRCodeCanvas value={qrUrl} size={160} />}
      {token && (
        <div className="mt-2 text-sm break-all">
          <a href={qrUrl} className="underline text-primary" target="_blank" rel="noreferrer">
            Open on this device
          </a>
          <div className="text-xs text-muted-foreground mt-1">{qrUrl}</div>
        </div>
      )}
      {/* simulate pulse removed (dev-only) */}

      {polling && <div>Waiting for upload...</div>}

      {latest.found && (
        <div className="space-y-1 text-sm">
          <div>HR: {latest.heart_rate}</div>
          <div>BR: {latest.breathing_rate}</div>
          <div>Stress: {latest.stress_index.toFixed(2)}</div>
          <div className={latest.break_recommended ? "text-red-600" : "text-green-600"}>
            {latest.break_recommended ? "Break Recommended" : "All Good"}
          </div>
        </div>
      )}
    </div>
  );
}
