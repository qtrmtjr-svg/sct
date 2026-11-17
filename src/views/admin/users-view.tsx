import { getTranslations } from "next-intl/server";
import type { UserView } from "@/lib/types";
import { toggleUserAction } from "@/server/admin-actions";
import { Button } from "@/views/ui/button";

export async function UsersView({ users, currentId }: { users: UserView[]; currentId: string }) {
  const t = await getTranslations("admin");
  const table = await getTranslations("table");
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 text-start font-medium">{t("adminName")}</th>
            <th className="px-4 py-3 text-start font-medium">{t("adminEmail")}</th>
            <th className="px-4 py-3 text-start font-medium">{table("status")}</th>
            <th className="px-4 py-3 text-start font-medium" />
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-muted" colSpan={4}>
                {t("empty")}
              </td>
            </tr>
          ) : null}
          {users.map((user) => (
            <tr key={user.id} className="border-t border-border">
              <td className="px-4 py-3 font-semibold">
                {user.name} {user.id === currentId ? <span className="text-xs font-medium text-muted">({t("you")})</span> : null}
              </td>
              <td className="px-4 py-3 text-muted" dir="ltr">
                {user.email}
              </td>
              <td className="px-4 py-3">{user.disabled ? t("accountOff") : t("accountOn")}</td>
              <td className="px-4 py-3 text-end">
                {user.id === currentId ? null : (
                  <form action={toggleUserAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="disabled" value={String(!user.disabled)} />
                    <Button type="submit" variant="secondary">
                      {user.disabled ? t("enable") : t("disable")}
                    </Button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
