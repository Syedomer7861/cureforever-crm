import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!supabaseUrl || !supabaseKey) {
     return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  // Refresh session and get user
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');
  const isDebugRoute = pathname === '/api/debug-auth';
  const isExcluded = pathname.startsWith('/_next') || pathname === '/favicon.ico';

  // Allow debug route without auth for diagnostic purposes
  if (isDebugRoute) {
    return supabaseResponse;
  }

  if (!user && !isAuthRoute && !isApiRoute && !isExcluded) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Admin Role Protection Logic
  if (user && ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    try {
      // Fetch user role from database using service role if available, otherwise anon fallback
      const adminRes = await fetch(
        `${supabaseUrl}/rest/v1/User?id=eq.${user.id}&select=role`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey}`,
          },
        }
      );

      if (adminRes.ok) {
        const users = await adminRes.json();
        if (users.length > 0 && users[0].role !== "admin") {
          if (isApiRoute) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
          }
          const url = request.nextUrl.clone();
          url.pathname = "/unauthorized";
          return NextResponse.redirect(url);
        }
      }
    } catch {
      // Fail open for admins if DB check fails
    }
  }

  return supabaseResponse;
}
