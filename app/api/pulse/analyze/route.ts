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

// Robust POST handler for /api/pulse/analyze
export async function POST(req: Request) {
  const PRESAGE_URL = process.env.PRESAGE_API_URL;
  const PRESAGE_KEY = process.env.PRESAGE_API_KEY;

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "missing file field (form key 'file')" }, { status: 400 });
    }

    // If upstream is configured, proxy with timeout and robust error handling
    if (PRESAGE_URL && PRESAGE_KEY) {
      const presageForm = new FormData();
      const filename = (file as any).name || "capture.webm";
      presageForm.append("file", file as Blob, filename);
      presageForm.append("mode", "pulse");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PRESAGE_TIMEOUT_MS);
      let presageRes: Response;
      try {
        presageRes = await fetch(PRESAGE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PRESAGE_KEY}`,
            // Do not set Content-Type: fetch will add the multipart boundary
          },
          body: presageForm as any,
          signal: controller.signal,
        });
      } catch (err: any) {
        clearTimeout(timeout);
        if (err?.name === "AbortError") {
          return NextResponse.json({ ok: false, error: "upstream timeout" }, { status: 504 });
        }
        return NextResponse.json({ ok: false, error: `network error: ${String(err)}` }, { status: 502 });
      }
      clearTimeout(timeout);

      // Upstream returned non-2xx
      if (!presageRes.ok) {
        const contentType = presageRes.headers.get("content-type") || "";
        const body = contentType.includes("application/json") ? await tryParseJson(presageRes) : await presageRes.text().catch(() => "<unreadable>");
        return NextResponse.json(
          { ok: false, error: "upstream error", upstreamStatus: presageRes.status, upstreamBody: body },
          { status: 502 }
        );
      }

      // Successful upstream response
      const data = await tryParseJson(presageRes as any);
      if (!data) {
        return NextResponse.json({ ok: false, error: "invalid json from upstream" }, { status: 502 });
      }

      // Normalize expected fields
      const hr = Number(data.heart_rate ?? data.hr ?? data.heartRate);
      const br = Number(data.breathing_rate ?? data.br ?? data.breathingRate);
      const confidence = Number(data.confidence ?? 1);

      if (!Number.isFinite(hr) || !Number.isFinite(br)) {
        return NextResponse.json({ ok: false, error: "upstream missing heart_rate or breathing_rate", upstream: data }, { status: 502 });
      }

      const { stress_index, break_recommended } = computeStressIndex(hr, br);
      return NextResponse.json({ ok: true, heart_rate: hr, breathing_rate: br, confidence, stress_index, break_recommended });
    }

    // No upstream configured - simulated analysis
    const hr = 60 + Math.floor(Math.random() * 26); // 60-85
    const br = 12 + Math.floor(Math.random() * 7); // 12-18
    const confidence = 0.8 + Math.random() * 0.2;
    const { stress_index, break_recommended } = computeStressIndex(hr, br);

    return NextResponse.json({ ok: true, heart_rate: hr, breathing_rate: br, confidence, stress_index, break_recommended });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}