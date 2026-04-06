import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/cadastro"];

/**
 * Next.js 16+: use `proxy.ts` + export `proxy` (Node por padrão na Vercel).
 * O antigo `middleware.ts` roda no Edge e costuma disparar MIDDLEWARE_INVOCATION_FAILED
 * com @supabase/ssr (getUser / refresh de cookies).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  try {
    if (!url || !anon) {
      if (!isPublic) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return supabaseResponse;
    }

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
          for (const [key, value] of Object.entries(headers)) {
            if (value != null) {
              supabaseResponse.headers.set(key, String(value));
            }
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublic) {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }

    if (user && (pathname === "/login" || pathname === "/cadastro")) {
      const dash = request.nextUrl.clone();
      dash.pathname = "/dashboard";
      dash.search = "";
      return NextResponse.redirect(dash);
    }

    if (user && pathname === "/") {
      const dash = request.nextUrl.clone();
      dash.pathname = "/dashboard";
      return NextResponse.redirect(dash);
    }

    return supabaseResponse;
  } catch (err) {
    console.error("[proxy]", err);
    if (isPublic) {
      return NextResponse.next();
    }
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
