import { TProduct } from "@/server/models/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";

type ProductCardProps = {
    product: TProduct;
};

export function ProductCard({ product }: ProductCardProps) {
    return (
        <Card className="gap-2 border-border/60 py-3 transition-shadow hover:shadow-md">
            <CardContent>
                <Link href={`/companies/${product.company}`} className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <h3 className="truncate text-sm font-semibold">{product.company}</h3>
                        <p className="text-xs text-muted-foreground">{product.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            <span>{product.location}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="secondary" className="font-mono text-xs font-semibold">
                            بيع: {formatNumber(product.sellPrice)} ج.م
                        </Badge>
                        <Badge variant="outline" className="font-mono text-xs">
                            شراء: {formatNumber(product.buyPrice)} ج.م
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            الكمية: <span className="font-semibold text-foreground">{product.count}</span>
                        </span>
                    </div>
                </Link>
            </CardContent>
        </Card>
    );
}
