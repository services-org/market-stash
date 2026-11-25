"use client";
import { useState } from "react";

import { LocationTabs, ProductCard, AddProductDialog } from "./_components";
import { PageHeader, EmptyState, SearchInput } from "@/components/common";
import { matchesSearch } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TProduct } from "@/server/models/product";
import { useGet } from "@/hooks/api";

export default function ProductsClient() {
    const [activeLocation, setActiveLocation] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const { data: locations = [], isPending: locationsLoading } = useGet<string[]>("/api/products?type=locations", {
        queryKey: ["locations"],
    });

    const { data: products = [], isPending: productsLoading } = useGet<TProduct[]>(
        activeLocation ? `/api/products?location=${encodeURIComponent(activeLocation)}` : "/api/products",
        { queryKey: ["products", activeLocation ?? "all"] },
    );

    const visibleProducts = products
        .filter((p) => matchesSearch(query, p.company, p.name, p.barcode))
        .toSorted((a, b) => a.company.localeCompare(b.company));

    return (
        <>
            <PageHeader title="المنتجات" action={<AddProductDialog />}>
                <div className="px-4 pb-2">
                    <SearchInput value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الشركة أو الباركود" />
                </div>
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
                ) : visibleProducts.length === 0 ? (
                    <EmptyState
                        message={products.length === 0 ? "لا توجد منتجات بعد. اضغط + لإضافة منتج جديد." : "لا توجد منتجات مطابقة للبحث."}
                        className="col-span-2"
                    />
                ) : (
                    visibleProducts.map((p) => <ProductCard key={p._id} product={p} />)
                )}
            </div>
        </>
    );
}
