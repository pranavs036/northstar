import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pbAuth = request.cookies.get("pb_auth");

  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isApiRoute = pathname.startsWith("/api");
  const isRoot = pathname === "/";

  // Validate the pb_auth cookie actually contains a PocketBase token
  let isAuthenticated = false;
  if (pbAuth?.value) {
    try {
      // PocketBase cookie is a JSON-encoded string with token + record
      const decoded = decodeURIComponent(pbAuth.value);
      const parsed = JSON.parse(decoded);
      isAuthenticated = !!(parsed.token && parsed.record);
    } catch {
      // Invalid cookie format — clear it
      const response = NextResponse.next();
      response.cookies.delete("pb_auth");
      return response;
    }
  }

  // Redirect unauthenticated users to login (except for public routes)
  if (!isAuthenticated && !isAuthPage && !isApiRoute && !isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
