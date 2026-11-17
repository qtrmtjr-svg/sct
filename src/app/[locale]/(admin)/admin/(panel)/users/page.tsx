import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAdminUsers } from "@/controllers/admin.controller";
import { ensureAdmin } from "@/lib/auth";
import { CreateAdminForm } from "@/views/admin/create-admin-form";
import { UsersView } from "@/views/admin/users-view";
import { LoadingBlock } from "@/views/ui/page-shell";

export default function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await ensureAdmin(locale);
  const t = await getTranslations("admin");
  const users = (await getAdminUsers()).filter((user) => user.role === "admin");
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-bold">{t("admins")}</h1>
      <CreateAdminForm />
      <UsersView users={users} currentId={session.id} />
    </div>
  );
}
