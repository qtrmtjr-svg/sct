import { ensureAdmin } from "@/lib/auth";
import { UserProfileView } from "@/views/admin/user-profile-view";

export default async function UserPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await ensureAdmin(locale);
  return <UserProfileView userId={id} />;
}
