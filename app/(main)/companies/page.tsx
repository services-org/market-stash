"use client";
import { useState } from "react";

import { PageHeader, EmptyState, SearchInput } from "@/components/common";
import { matchesSearch } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyCard } from "./_components";
import { useGet } from "@/hooks/api";

type TCompany = {
    _id: string;
    productCount: number;
    totalValue: number;
};

export default function CompaniesPage() {
    const { data: companies = [], isPending } = useGet<TCompany[]>("/api/companies", {
        queryKey: ["companies"],
    });

    const [query, setQuery] = useState("");
    const visible = companies.filter((c) => matchesSearch(query, c._id));

    return (
        <>
            <PageHeader title="الشركات" subtitle={`${companies.length} شركة`}>
                <div className="px-4 pb-3">
                    <SearchInput value={query} onChange={setQuery} placeholder="ابحث عن شركة" />
                </div>
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 p-4">
                {isPending ? (
                    Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
                ) : visible.length === 0 ? (
                    <EmptyState
                        message={companies.length === 0 ? "لا توجد شركات بعد. أضف منتجات لتظهر الشركات هنا." : "لا توجد شركات مطابقة للبحث."}
                        className="col-span-2"
                    />
                ) : (
                    visible.map((company) => <CompanyCard key={company._id} company={company} />)
                )}
            </div>
        </>
    );
}
