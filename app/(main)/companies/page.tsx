"use client";

import { useGet } from "@/hooks/api";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyCard } from "./_components";

type TCompany = {
    _id: string;
    productCount: number;
    totalValue: number;
};

export default function CompaniesPage() {
    const { data: companies = [], isPending } = useGet<TCompany[]>("/api/companies", {
        queryKey: ["companies"],
    });

    return (
        <>
            <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur-sm">
                <div className="px-4 pt-4 pb-3">
                    <h1 className="text-lg font-bold">الشركات</h1>
                    <p className="text-xs text-muted-foreground">{companies.length} شركة</p>
                </div>
            </div>

            <div className="space-y-3 p-4">
                {isPending ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-18 w-full rounded-xl" />)
                ) : companies.length === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">لا توجد شركات بعد. أضف منتجات لتظهر الشركات هنا.</div>
                ) : (
                    companies.map((company) => <CompanyCard key={company._id} company={company} />)
                )}
            </div>
        </>
    );
}
