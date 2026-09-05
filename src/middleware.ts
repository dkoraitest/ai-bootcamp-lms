import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isFlow2ArtifactPath(pathname: string): boolean {
  // Decode escaped bytes (including nested escapes) before matching. Byte-wise
  // decoding keeps a malformed UTF-8 filename from hiding an encoded prefix.
  let decoded = pathname;
  for (;;) {
    const next = decoded.replace(/%([0-9a-f]{2})/gi, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    );
    if (next === decoded) break;
    decoded = next;
  }
  const segments: string[] = [];
  for (const segment of decoded.replace(/\\/g, "/").split("/")) {
    if (segment === "..") segments.pop();
    else if (segment && segment !== ".") segments.push(segment);
  }
  return segments[0] === "artifacts" && segments[1] === "flow-2";
}

function artifactForbidden() {
  return new NextResponse("Forbidden", {
    status: 403,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function middleware(request: NextRequest) {
  const protectedArtifact = isFlow2ArtifactPath(request.nextUrl.pathname);
  // Skip if env vars are not configured (e.g. preview without Supabase)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (protectedArtifact) return artifactForbidden();
    return NextResponse.next({ request });
  }

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

  let authResult;
  try {
    authResult = await supabase.auth.getUser();
  } catch (error) {
    if (protectedArtifact) return artifactForbidden();
    throw error;
  }
  const { data: { user }, error: authError } = authResult;
  if (protectedArtifact && authError) return artifactForbidden();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    if (protectedArtifact) response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  if (protectedArtifact) {
    try {
      const { data, error } = await supabase.rpc("get_available_cohorts");
      if (error || !Array.isArray(data) || !data.some(
        (cohort) => cohort !== null && typeof cohort === "object" && cohort.id === "flow-2"
      )) {
        return artifactForbidden();
      }
    } catch {
      return artifactForbidden();
    }
    // The same URL has different access rights per session, including when
    // someone signs out or switches accounts in the same browser.
    supabaseResponse.headers.set("Cache-Control", "private, no-store");
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Админские страницы закрыты на сервере: проверки в браузере
  // недостаточно, страницу можно открыть по прямой ссылке.
  if (pathname.startsWith("/admin")) {
    const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role;
    if (role !== "admin" && role !== "expert") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
