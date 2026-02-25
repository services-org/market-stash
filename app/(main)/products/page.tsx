"use client";
import { useState } from "react";

import { LocationTabs, ProductCard, AddProductDialog } from "./_components";
import { PageHeader, EmptyState } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { TProduct } from "@/server/models/product";
import { useGet } from "@/hooks/api";

export default function ProductsClient() {
    const [activeLocation, setActiveLocation] = useState<string | null>(null);

    const { data: locations = [], isPending: locationsLoading } = useGet<string[]>("/api/products?type=locations", {
        queryKey: ["locations"],
    });

    const { data: products = [], isPending: productsLoading } = useGet<TProduct[]>(
        activeLocation ? `/api/products?location=${encodeURIComponent(activeLocation)}` : "/api/products",
        { queryKey: ["products", activeLocation ?? "all"] },
    );

    return (
        <>
            <PageHeader title="المنتجات" action={<AddProductDialog />}>
                {locationsLoading ? (
                    <div className="flex gap-2 px-4 pb-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-7 w-16 rounded-full" />
                        ))}
                    </div>
                ) : locations.length > 0 ? (
                    <LocationTabs locations={locations} active={activeLocation} onSelect={setActiveLocation} />
                ) : null}
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 p-4">
                {productsLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)
                ) : products.length === 0 ? (
                    <EmptyState message="لا توجد منتجات بعد. اضغط + لإضافة منتج جديد." className="col-span-2" />
                ) : (
                    products.toSorted((a, b) => a.company.localeCompare(b.company)).map((p) => <ProductCard key={p._id} product={p} />)
                )}
            </div>
        </>
    );
}
