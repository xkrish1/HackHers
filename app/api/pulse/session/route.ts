import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST() {
  const token = crypto.randomBytes(16).toString("base64url");
  return NextResponse.json({
    token,
    expires_in_sec: 600,
  });
}
