import { TProduct } from "@/server/models/product";
import { formatNumber } from "@/lib/utils";
import { MapPin, Box } from "lucide-react";
import { isLowStock } from "@/lib/stock";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ProductCardProps = {
    product: TProduct;
};

export function ProductCard({ product }: ProductCardProps) {
    return (
        <Link
            href={`/companies/${encodeURIComponent(product.company)}`}
            className="flex flex-col rounded-2xl border border-border/60 bg-card p-3 transition-all active:scale-[0.97] hover:shadow-md"
        >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Box className="size-4 text-primary" />
            </div>
            <h3 className="truncate text-[13px] font-bold">{product.company}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.name}</p>

            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                <span>{product.location}</span>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2.5">
                <div className="text-xs">
                    <p className="font-bold text-primary">{formatNumber(product.sellPrice)}</p>
                    <p className="text-muted-foreground">{formatNumber(product.buyPrice)}</p>
                </div>
                <div
                    className={cn(
                        "rounded-lg px-2 py-1 text-xs font-bold",
                        product.count <= 0
                            ? "bg-destructive/15 text-destructive"
                            : isLowStock(product)
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-muted",
                    )}
                >
                    {product.count <= 0 ? "نفذ" : product.count}
                </div>
            </div>
        </Link>
    );
}
