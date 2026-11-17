import { getTranslations } from "next-intl/server";
import { formatKwd } from "@/lib/money";
import type { ProductView } from "@/lib/types";
import { toggleProductAction } from "@/server/admin-actions";
import { Badge } from "@/views/ui/badge";
import { Button } from "@/views/ui/button";

export async function CatalogView({ products }: { products: ProductView[] }) {
  const t = await getTranslations("admin");
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{product.name}</td>
              <td className="px-4 py-3 text-muted">{product.kind}</td>
              <td className="px-4 py-3">{formatKwd(product.amountHalalas, "en")}</td>
              <td className="px-4 py-3">
                <Badge status={product.active ? "completed" : "refunded"} label={product.active ? t("active") : t("inactive")} />
              </td>
              <td className="px-4 py-3">
                <form action={toggleProductAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="active" value={String(!product.active)} />
                  <Button type="submit" variant="secondary">
                    {product.active ? t("disable") : t("enable")}
                  </Button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
