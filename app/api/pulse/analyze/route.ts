import { NextResponse } from "next/server";
import { computeStressIndex } from "@/lib/pulseStore";

const PRESAGE_TIMEOUT_MS = 30_000; // 30s

async function tryParseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildSimulatedResult() {
  const hr = 60 + Math.floor(Math.random() * 26); // 60-85
  const br = 12 + Math.floor(Math.random() * 7); // 12-18
  const confidence = 0.8 + Math.random() * 0.2;
  const { stress_index, break_recommended } = computeStressIndex(hr, br);

  return {
    ok: true,
    heart_rate: hr,
    breathing_rate: br,
    confidence,
    stress_index,
    break_recommended,
    provider: "simulated",
  };
}

function normalizeAnalyzeUrl(inputUrl: string): string {
  const trimmed = inputUrl.trim();
  if (!trimmed) return trimmed;
  if (/\/analyze\/?$/i.test(trimmed)) return trimmed;
  return `${trimmed.replace(/\/+$/, "")}/analyze`;
}

// Robust POST handler for /api/pulse/analyze
export async function POST(req: Request) {
  const PRESAGE_URL =
    process.env.PRESAGE_LOCAL_URL || process.env.PRESAGE_API_URL || "";
  const PRESAGE_KEY = process.env.PRESAGE_API_KEY || "";
  const PRESAGE_LOCAL_AUTH_HEADER = process.env.PRESAGE_LOCAL_AUTH_HEADER || "";

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "missing file field (form key 'file')" }, { status: 400 });
    }

    // If upstream is configured, proxy with timeout and robust error handling
    if (PRESAGE_URL) {
      const presageForm = new FormData();
      const filename = (file as any).name || "capture.webm";
      presageForm.append("file", file as Blob, filename);
      presageForm.append("mode", "pulse");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PRESAGE_TIMEOUT_MS);
      let presageRes: Response;
      const targetUrl = normalizeAnalyzeUrl(PRESAGE_URL);
      try {
        presageRes = await fetch(targetUrl, {
          method: "POST",
          headers: {
            ...(PRESAGE_LOCAL_AUTH_HEADER
              ? { Authorization: PRESAGE_LOCAL_AUTH_HEADER }
              : PRESAGE_KEY
                ? { Authorization: `Bearer ${PRESAGE_KEY}` }
                : {}),
            // Do not set Content-Type: fetch will add the multipart boundary
          },
          body: presageForm as any,
          signal: controller.signal,
        });
      } catch (err: any) {
        clearTimeout(timeout);
        if (err?.name === "AbortError") {
          console.warn("[api/pulse/analyze] Upstream timeout, falling back to simulation");
          return NextResponse.json({
            ...buildSimulatedResult(),
            warning: "upstream timeout",
          });
        }
        console.warn("[api/pulse/analyze] Upstream network error, falling back:", err);
        return NextResponse.json({
          ...buildSimulatedResult(),
          warning: `network error: ${String(err)}`,
        });
      }
      clearTimeout(timeout);

      // Upstream returned non-2xx
      if (!presageRes.ok) {
        const contentType = presageRes.headers.get("content-type") || "";
        const body = contentType.includes("application/json")
          ? await tryParseJson(presageRes)
          : await presageRes.text().catch(() => "<unreadable>");
        console.warn("[api/pulse/analyze] Upstream non-2xx, falling back:", {
          status: presageRes.status,
          body,
        });
        return NextResponse.json({
          ...buildSimulatedResult(),
          warning: "upstream error",
          upstreamStatus: presageRes.status,
        });
      }

      // Successful upstream response
      const data = await tryParseJson(presageRes as any);
      if (!data) {
        console.warn("[api/pulse/analyze] Invalid upstream JSON, falling back");
        return NextResponse.json({
          ...buildSimulatedResult(),
          warning: "invalid json from upstream",
        });
      }

      // Normalize expected fields
      const hr = Number(data.heart_rate ?? data.hr ?? data.heartRate);
      const br = Number(data.breathing_rate ?? data.br ?? data.breathingRate);
      const confidence = Number(data.confidence ?? 1);

      if (!Number.isFinite(hr) || !Number.isFinite(br)) {
        console.warn("[api/pulse/analyze] Missing upstream vitals, falling back:", data);
        return NextResponse.json({
          ...buildSimulatedResult(),
          warning: "upstream missing heart_rate or breathing_rate",
        });
      }

      const { stress_index, break_recommended } = computeStressIndex(hr, br);
      return NextResponse.json({
        ok: true,
        heart_rate: hr,
        breathing_rate: br,
        confidence,
        stress_index,
        break_recommended,
        provider: "presage",
      });
    }

    // No upstream configured - simulated analysis
    return NextResponse.json(buildSimulatedResult());
  } catch (err: any) {
    console.error("[api/pulse/analyze] Fatal error, falling back:", err);
    return NextResponse.json({
      ...buildSimulatedResult(),
      warning: String(err),
    });
  }
}