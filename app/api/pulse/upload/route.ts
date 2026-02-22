import { NextResponse } from "next/server";
import { computeStressIndex, savePulse } from "@/lib/pulseStore";

export async function POST(req: Request) {
  const body = await req.json();

  const token = String(body.token || "");
  const heart_rate = Number(body.heart_rate);
  const breathing_rate = Number(body.breathing_rate);
  const confidence = Number(body.confidence ?? 1);

  if (!token || !Number.isFinite(heart_rate) || !Number.isFinite(breathing_rate)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { stress_index, break_recommended } =
    computeStressIndex(heart_rate, breathing_rate);

  savePulse(token, {
    heart_rate,
    breathing_rate,
    confidence,
    stress_index,
    break_recommended,
    created_at: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
