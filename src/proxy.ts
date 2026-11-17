import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { ADMIN_COOKIE, readAdminToken } from "./lib/token";

const handle = createMiddleware(routing);

// Matches /admin, /ar/admin, /en/admin/orders, ... (but not /admin/login)
const ADMIN_PATH = /^\/(?:([a-z]{2})\/)?admin(?:\/(.*))?$/;

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(ADMIN_PATH);
  if (match) {
    const [, localeSegment, rest = ""] = match;
    const isLogin = rest === "login" || rest.startsWith("login/");
    if (!isLogin && !readAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
      const locale = localeSegment && (routing.locales as readonly string[]).includes(localeSegment)
        ? localeSegment
        : routing.defaultLocale;
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/admin/login`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return handle(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
