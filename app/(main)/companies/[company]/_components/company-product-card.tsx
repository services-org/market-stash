"use client";
import { Trash2, MapPin } from "lucide-react";

import { Card, ConfirmDialog } from "@/components/common";
import { EditProductDialog } from "./edit-product-dialog";
import { TProduct } from "@/server/models/product";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { useDelete } from "@/hooks/api";

export function CompanyProductCard({ product }: Readonly<{ product: TProduct }>) {
    const { mutate, isPending } = useDelete(`/api/products/${product._id}`, {
        invalidateKeys: ["products", "companies", "company-products", "locations"],
    });

    return (
        <Card>
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
                    <ConfirmDialog
                        trigger={
                            <button className="inline-flex size-8 items-center justify-center rounded-md text-destructive hover:bg-accent hover:text-destructive">
                                <Trash2 className="size-3.5" />
                            </button>
                        }
                        title="حذف المنتج"
                        description={
                            <>
                                هل أنت متأكد من حذف <strong>{product.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
                            </>
                        }
                        onConfirm={() => mutate()}
                        isPending={isPending}
                    />
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
        </Card>
    );
}
