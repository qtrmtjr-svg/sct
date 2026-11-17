import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

/** Default admin home → payment approvals (main workflow). */
export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/admin/approvals`);
}
