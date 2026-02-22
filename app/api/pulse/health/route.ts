import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const localMode = String(process.env.PRESAGE_LOCAL_MODE || "").toLowerCase() === "true";
  const localUrl = process.env.PRESAGE_LOCAL_URL || "";

  if (!localMode || !localUrl) {
    return NextResponse.json({ ok: true, mode: "cloud-or-simulated", url: req.url });
  }

  try {
    const healthUrl = new URL(localUrl);
    healthUrl.pathname = "/health";
    healthUrl.search = "";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(healthUrl.toString(), { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, mode: "local", localUrl, localHealthStatus: res.status },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, mode: "local", localUrl, localHealthy: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, mode: "local", localUrl, localHealthy: false, error: String(error) },
      { status: 502 }
    );
  }
}
