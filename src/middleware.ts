import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/auth/middleware";
import createIntlMiddleware from "@/lib/i18n/middleware";

const intlMiddleware = createIntlMiddleware;

export async function middleware(request: NextRequest) {
  // Handle internationalization first
  const intlResponse = intlMiddleware(request);

  // If intl middleware wants to redirect, return that response
  if (intlResponse?.headers.get("location")) {
    return intlResponse;
  }

  // Handle authentication
  const authResponse = await updateSession(request);

  // If auth middleware wants to redirect, return that response
  if (authResponse?.headers.get("location")) {
    return authResponse;
  }

  // Return the intl response or continue with the request
  return intlResponse || NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (except auth callback)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|api(?!/auth)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
