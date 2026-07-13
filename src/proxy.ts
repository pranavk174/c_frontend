import { NextRequest, NextResponse } from "next/server";

const middleware = (req: NextRequest) => {
  const token = req.cookies.get("accessToken")?.value;
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");
  const isbackend = req.nextUrl.pathname.startsWith("/api");

  if (isbackend) {
    return NextResponse.next();
  }

  if (!isLoginPage && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
};

export default middleware;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|manifest.webmanifest).*)",
  ],
};
