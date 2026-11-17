export function asLocale(value: string | undefined): "ar" | "en" {
  return value === "en" ? "en" : "ar";
}
