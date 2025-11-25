import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Récupérer l'IP depuis les headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare

  let ip: string | null = null;

  if (forwardedFor) {
    // x-forwarded-for peut contenir plusieurs IPs, prendre la première
    ip = forwardedFor.split(",")[0].trim();
  } else if (realIp) {
    ip = realIp;
  } else if (cfConnectingIp) {
    ip = cfConnectingIp;
  }

  return NextResponse.json({ ip });
}

