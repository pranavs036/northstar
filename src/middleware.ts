import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pbAuth = request.cookies.get("pb_auth");

  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isApiRoute = pathname.startsWith("/api");
  const isRoot = pathname === "/";

  // Redirect unauthenticated users to login (except for public routes)
  if (!pbAuth && !isAuthPage && !isApiRoute && !isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (pbAuth && isAuthPage) {
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
