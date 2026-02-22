import { NextResponse } from "next/server";
import { getPulse } from "@/lib/pulseStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";

  const reading = getPulse(token);

  if (!reading) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    ...reading,
  });
}
