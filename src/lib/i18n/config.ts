import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// Can be imported from a shared config
export const locales = ["en", "es"] as const;
export const defaultLocale = "en" as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validLocale = locale as Locale;
  if (!locales.includes(validLocale)) notFound();

  return {
    locale: validLocale,
    messages: (await import(`../../../messages/${validLocale}.json`)).default,
    timeZone: "UTC",
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
        medium: {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        },
        long: {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        },
      },
      number: {
        precise: {
          maximumFractionDigits: 5,
        },
        currency: {
          style: "currency",
          currency: "USD",
        },
      },
      list: {
        enumeration: {
          style: "long",
          type: "conjunction",
        },
      },
    },
  };
});

// Helper function to get locale from pathname
export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split("/");
  const potentialLocale = segments[1];

  if (locales.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale;
  }

  return defaultLocale;
}

// Helper function to remove locale from pathname
export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);

  if (locale === defaultLocale) {
    return pathname;
  }

  return pathname.replace(`/${locale}`, "") || "/";
}

// Helper function to add locale to pathname
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  if (locale === defaultLocale) {
    return pathname;
  }

  const cleanPathname = removeLocaleFromPathname(pathname);
  return `/${locale}${cleanPathname}`;
}
