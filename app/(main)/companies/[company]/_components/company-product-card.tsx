import { TProduct } from "@/server/models/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { EditProductDialog } from "./edit-product-dialog";
import { DeleteProductDialog } from "./delete-product-dialog";

export function CompanyProductCard({ product }: Readonly<{ product: TProduct }>) {
    return (
        <Card className="gap-2 border-border/60 py-3 transition-shadow hover:shadow-md">
            <CardContent className="px-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <h3 className="truncate text-sm font-semibold">{product.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            <span>{product.location}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <EditProductDialog product={product} />
                        <DeleteProductDialog product={product} />
                    </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
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
            </CardContent>
        </Card>
    );
}
