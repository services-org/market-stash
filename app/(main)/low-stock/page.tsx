"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

import { PageHeader, EmptyState, SearchInput } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TProduct } from "@/server/models/product";
import { matchesSearch } from "@/lib/utils";
import { useGet } from "@/hooks/api";

export default function LowStockPage() {
    const [query, setQuery] = useState("");

    const { data: products = [], isPending } = useGet<TProduct[]>("/api/products?type=low-stock", { queryKey: ["products", "low-stock"] });

    const filtered = useMemo(() => products.filter((p) => matchesSearch(query, p.company, p.name, p.location)), [products, query]);

    return (
        <>
            <PageHeader title="مخزون منخفض" subtitle={isPending ? undefined : `${filtered.length} منتج`}>
                <div className="px-4 pb-3">
                    <SearchInput value={query} onChange={setQuery} placeholder="ابحث في المنتجات" />
                </div>
            </PageHeader>

            <div className="space-y-2 p-4">
                {isPending ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                ) : filtered.length === 0 ? (
                    <EmptyState message={products.length === 0 ? "لا توجد منتجات وصلت لحد التنبيه. يمكنك تحديد حد التنبيه لكل منتج من شاشة تعديل المنتج." : "لا توجد نتائج."} />
                ) : (
                    filtered.map((product) => (
                        <Link
                            key={product._id}
                            href={`/companies/${encodeURIComponent(product.company)}`}
                            className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card p-3 hover:shadow-md"
                        >
                            <div className="min-w-0 space-y-1">
                                <h3 className="truncate text-sm font-semibold">{product.name}</h3>
                                <p className="truncate text-xs text-muted-foreground">
                                    {product.company} • {product.location}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge variant={product.count <= 0 ? "destructive" : "secondary"} className="font-mono text-xs">
                                    {product.count <= 0 ? "نفذ" : `المتبقي ${product.count}`}
                                </Badge>
                                <span className="text-xs text-muted-foreground">الحد الأدنى {product.minStock}</span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </>
    );
}
