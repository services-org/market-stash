"use client";
import { use, useMemo, useState } from "react";

import { PageHeader, EmptyState, SearchInput } from "@/components/common";
import { matchesSearch } from "@/lib/utils";
import { CompanyProductCard } from "./_components";
import { Skeleton } from "@/components/ui/skeleton";
import { TProduct } from "@/server/models/product";
import { useGet } from "@/hooks/api";

type Params = { params: Promise<{ company: string }> };

export default function CompanyDetailPage({ params }: Readonly<Params>) {
    const { company } = use(params);
    const decodedCompany = decodeURIComponent(company);

    const { data: products = [], isPending } = useGet<TProduct[]>(`/api/companies/${company}`, { queryKey: ["company-products", company] });

    const [query, setQuery] = useState("");

    const grouped = useMemo(() => {
        const map = new Map<string, TProduct[]>();
        for (const p of products.filter((p) => matchesSearch(query, p.name, p.location, p.barcode))) {
            const list = map.get(p.location) ?? [];
            list.push(p);
            map.set(p.location, list);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [products, query]);

    return (
        <>
            <PageHeader title={decodedCompany} subtitle={`${products.length} منتج`} backHref="/companies">
                <div className="px-4 pb-3">
                    <SearchInput value={query} onChange={setQuery} placeholder="ابحث في منتجات الشركة" />
                </div>
            </PageHeader>

            <div className="p-4">
                {isPending ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-28 w-full rounded-xl" />
                        ))}
                    </div>
                ) : grouped.length === 0 ? (
                    <EmptyState message={products.length === 0 ? "لا توجد منتجات لهذه الشركة." : "لا توجد منتجات مطابقة للبحث."} />
                ) : (
                    <div className="space-y-5">
                        {grouped.map(([location, items]) => (
                            <div key={location}>
                                <h2 className="mb-2 text-lg font-bold text-orange-400">{location}</h2>
                                <div className="space-y-2">
                                    {items.map((product) => (
                                        <CompanyProductCard key={product._id} product={product} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
