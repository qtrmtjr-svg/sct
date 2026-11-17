import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const common = await getTranslations("common");
  const columns = [
    {
      title: t("about"),
      links: [
        ["/support", t("about")],
        ["/support", t("vision")],
        ["/support", t("investors")],
        ["/support", t("suppliers")],
        ["/support", t("governance")],
        ["/support", t("certificates")],
        ["/support", t("news")],
      ],
    },
    {
      title: t("support"),
      links: [
        ["/bills", t("payChannels")],
        ["/support", t("security")],
        ["/support", t("coverage")],
        ["/support", t("findUs")],
        ["/support", t("social")],
        ["/support", t("contact")],
        ["/support", t("sitemap")],
      ],
    },
    {
      title: t("group"),
      links: [
        ["/", "stc"],
        ["/support", t("ksa")],
        ["/support", t("bahrain")],
      ],
    },
    {
      title: t("careers"),
      links: [
        ["/support", t("careers")],
        ["/support", t("jobs")],
      ],
    },
  ] as const;

  const socials = [
    { name: "LinkedIn", src: "/icons/linkedin.png" },
    { name: "X", src: "/icons/x.png" },
    { name: "Facebook", src: "/icons/facebook.png" },
    { name: "TikTok", src: "/icons/tiktok.png" },
    { name: "Instagram", src: "/icons/instagram.png" },
    { name: "YouTube", src: "/icons/youtube.png" },
  ] as const;

  return (
    <footer className="mt-auto bg-brand text-white">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-4 gap-y-8 px-4 py-12 lg:grid-cols-4 lg:gap-8">
        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-semibold text-white/80">{column.title}</h2>
            <ul className="mt-3 grid gap-2 text-sm text-white/90">
              {column.links.map(([href, label]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="px-4 pb-10 text-center lg:hidden">
        <img src="/icons/logo-white.svg" alt="stc" className="mx-auto h-16 w-auto" />
        <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-white/90">{t("tagline")}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {socials.map((item) => (
            <Link
              key={item.name}
              href="/support"
              aria-label={item.name}
              className="grid h-10 w-10 place-items-center overflow-hidden rounded-full hover:opacity-80"
            >
              <img src={item.src} alt="" className="h-10 w-10 object-contain" />
            </Link>
          ))}
        </div>
      </div>
      <div className="hidden border-t border-white/15 lg:block">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm text-white/80">{t("blurb")}</p>
          <p className="text-xs text-white/70">{common("footer")}</p>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-3 px-4 py-4 text-xs text-white/70 lg:flex-row lg:justify-between">
          <p>
            {t("rights")} © {new Date().getFullYear()} stc
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/support" className="hover:text-white">{t("privacy")}</Link>
            <Link href="/support" className="hover:text-white">{t("terms")}</Link>
            <Link href="/support" className="hover:text-white">{t("quality")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

