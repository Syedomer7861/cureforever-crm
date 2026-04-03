import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "MISSING";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "MISSING";

  return NextResponse.json({
    url: {
      length: url.length,
      start: url.substring(0, 8),
      end: url.substring(url.length - 4),
    },
    anonKey: {
      length: anonKey.length,
      start: anonKey.substring(0, 8),
      end: anonKey.substring(anonKey.length - 4),
    },
    serviceKey: {
      length: serviceKey.length,
      start: serviceKey.substring(0, 8),
      end: serviceKey.substring(serviceKey.length - 4),
    }
  });
}
