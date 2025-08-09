import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./config";

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always use locale prefix for all locales
  localePrefix: "as-needed",

  // Redirect to default locale if no locale prefix is present
  localeDetection: true,

  // Pathnames configuration
  pathnames: {
    "/": "/",
    "/about": {
      en: "/about",
      es: "/acerca",
    },
    "/contact": {
      en: "/contact",
      es: "/contacto",
    },
    "/blog": {
      en: "/blog",
      es: "/blog",
    },
    "/dashboard": {
      en: "/dashboard",
      es: "/panel",
    },
    "/profile": {
      en: "/profile",
      es: "/perfil",
    },
    "/settings": {
      en: "/settings",
      es: "/configuracion",
    },
  },
});

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(es|en)/:path*"],
};
