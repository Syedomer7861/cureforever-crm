import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Admin-only routes — agents will be redirected to /unauthorized
const ADMIN_ONLY_ROUTES = [
  "/settings",
  "/import",
  "/integrations",
  "/team",
  "/api/settings",
  "/api/import",
  "/api/integrations",
  "/api/team",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in → redirect to login (except for /login itself)
  if (!user && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in but on login page → redirect to dashboard
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Check admin-only routes
  if (user && ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    try {
      // Fetch user role using service role key to bypass RLS
      const adminRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/User?id=eq.${user.id}&select=role`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        }
      );

      if (adminRes.ok) {
        const users = await adminRes.json();
        // If user exists in DB and is NOT admin → block
        if (users.length > 0 && users[0].role !== "admin") {
          // For API routes return 403
          if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
          }
          // For pages redirect to unauthorized
          const url = request.nextUrl.clone();
          url.pathname = "/unauthorized";
          return NextResponse.redirect(url);
        }
        // If user NOT in DB → they're the original admin, allow through
      }
    } catch {
      // DB error → allow through (fail open for admin)
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
