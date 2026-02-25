"use client";
import { PageHeader, EmptyState } from "@/components/common";
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

    return (
        <>
            <PageHeader title="الشركات" subtitle={`${companies.length} شركة`} />

            <div className="grid grid-cols-2 gap-3 p-4">
                {isPending ? (
                    Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
                ) : companies.length === 0 ? (
                    <EmptyState message="لا توجد شركات بعد. أضف منتجات لتظهر الشركات هنا." className="col-span-2" />
                ) : (
                    companies.map((company) => <CompanyCard key={company._id} company={company} />)
                )}
            </div>
        </>
    );
}
