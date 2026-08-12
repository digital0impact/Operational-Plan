import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "session_token";
const PROTECTED_PREFIXES = ["/dashboard", "/wizard", "/export"];
const AUTH_PATHS = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
  if (isAuthPath && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/wizard/:path*", "/export", "/login", "/register"],
};
