"use client";

import { formatKwd } from "@/lib/money";
import { cn } from "@/lib/cn";
import type { ProductView } from "@/lib/types";

export function AmountPicker({
  products,
  selectedId,
  locale,
  onSelect,
}: {
  products: ProductView[];
  selectedId: string;
  locale: string;
  onSelect: (product: ProductView) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {products.map((product) => {
        const selected = product.id === selectedId;
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product)}
            className={cn(
              "rounded-xl border px-2 py-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary",
              selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-ink hover:border-primary",
            )}
          >
            {formatKwd(product.amountHalalas, locale)}
          </button>
        );
      })}
    </div>
  );
}
