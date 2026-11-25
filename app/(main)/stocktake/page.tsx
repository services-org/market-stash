"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader, EmptyState, SearchInput } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TProduct } from "@/server/models/product";
import { LOCATIONS } from "@/lib/constants";
import { matchesSearch, cn } from "@/lib/utils";
import { useCreate, useGet } from "@/hooks/api";

/** Stocktake: count the shelves, type the real quantities, and apply all the differences at once. */
export default function StocktakePage() {
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [counted, setCounted] = useState<Record<string, string>>({});

    const { data: products = [], isPending } = useGet<TProduct[]>("/api/products", { queryKey: ["products"] });

    const { mutate, isPending: saving } = useCreate<{ updated: number }, { items: { id: string; count: number }[] }>("/api/products/stocktake", {
        invalidateKeys: ["products", "companies", "company-products", "analytics"],
        onSuccess: ({ updated }) => {
            toast.success(`تم تعديل كمية ${updated} منتج`);
            setCounted({});
        },
    });

    const filtered = useMemo(
        () => products.filter((p) => (!location || p.location === location) && matchesSearch(query, p.name, p.company, p.barcode)),
        [products, location, query],
    );

    // Only products where something was typed and it differs from the system quantity
    const changes = products
        .filter((p) => counted[p._id] !== undefined && counted[p._id] !== "" && Number(counted[p._id]) !== p.count)
        .map((p) => ({ id: p._id, count: Number(counted[p._id]) }));

    return (
        <>
            <PageHeader title="جرد المخزن" subtitle="اكتب الكمية الفعلية، والتطبيق يوضح الفرق">
                <div className="space-y-2 px-4 pb-3">
                    <SearchInput value={query} onChange={setQuery} placeholder="ابحث بالمنتج أو الشركة أو الباركود" />
                    <div className="flex flex-wrap gap-2">
                        {["", ...LOCATIONS].map((l) => (
                            <button
                                key={l || "all"}
                                type="button"
                                onClick={() => setLocation(l)}
                                className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                                    location === l ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground",
                                )}
                            >
                                {l || "كل الأماكن"}
                            </button>
                        ))}
                    </div>
                </div>
            </PageHeader>

            <div className="space-y-2 p-4 pb-40">
                {isPending ? (
                    Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                ) : filtered.length === 0 ? (
                    <EmptyState message="لا توجد منتجات." />
                ) : (
                    filtered.slice(0, 80).map((p) => {
                        const value = counted[p._id];
                        const diff = value !== undefined && value !== "" ? Number(value) - p.count : 0;
                        return (
                            <div key={p._id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{p.name}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {p.company} • {p.location} • بالنظام {p.count}
                                    </p>
                                </div>
                                {diff !== 0 && (
                                    <span dir="ltr" className={cn("font-mono text-xs font-bold", diff > 0 ? "text-emerald-500" : "text-destructive")}>
                                        {diff > 0 ? `+${diff}` : diff}
                                    </span>
                                )}
                                <Input
                                    aria-label={`الكمية الفعلية لـ ${p.name}`}
                                    inputMode="numeric"
                                    placeholder={String(p.count)}
                                    value={value ?? ""}
                                    onChange={(e) => setCounted((prev) => ({ ...prev, [p._id]: e.target.value.replace(/\D/g, "") }))}
                                    className="w-20 text-center"
                                />
                            </div>
                        );
                    })
                )}
                {filtered.length > 80 && <p className="py-2 text-center text-xs text-muted-foreground">يظهر أول 80 منتج. استخدم البحث أو المكان لتضييق القائمة.</p>}
            </div>

            {changes.length > 0 && (
                <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md border-t border-border/60 bg-background/95 p-3 backdrop-blur-sm">
                    <Button className="w-full" disabled={saving} onClick={() => mutate({ items: changes })}>
                        {saving ? "جاري الحفظ..." : `تطبيق الجرد (${changes.length} منتج)`}
                    </Button>
                </div>
            )}
        </>
    );
}
