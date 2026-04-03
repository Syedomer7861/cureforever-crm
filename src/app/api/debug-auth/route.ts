import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "MISSING";
  
  return NextResponse.json({
    url: {
      length: url.length,
      trimmedLength: url.trim().length,
      hasLeadingSpace: url.startsWith(" "),
      hasTrailingSpace: url.endsWith(" "),
      start: url.substring(0, 8),
      end: url.substring(url.length - 4),
    },
    anonKey: {
      length: anonKey.length,
      trimmedLength: anonKey.trim().length,
      hasLeadingSpace: anonKey.startsWith(" "),
      hasTrailingSpace: anonKey.endsWith(" "),
      start: anonKey.substring(0, 8),
      end: anonKey.substring(anonKey.length - 4),
    }
  });
}
