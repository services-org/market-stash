"use client";

import { use } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useGet } from "@/hooks/api";
import { Skeleton } from "@/components/ui/skeleton";
import { TProduct } from "@/server/models/product";
import { CompanyProductCard } from "./_components";

type Params = { params: Promise<{ company: string }> };

export default function CompanyDetailPage({ params }: Readonly<Params>) {
    const { company } = use(params);
    const decodedCompany = decodeURIComponent(company);

    const { data: products = [], isPending } = useGet<TProduct[]>(`/api/companies/${company}`, { queryKey: ["company-products", company] });

    return (
        <>
            <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur-sm">
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <Link href="/companies" className="flex size-8 items-center justify-center rounded-full hover:bg-accent">
                        <ArrowRight className="size-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold">{decodedCompany}</h1>
                        <p className="text-xs text-muted-foreground">{products.length} منتج</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-4">
                {isPending ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
                ) : products.length === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">لا توجد منتجات لهذه الشركة.</div>
                ) : (
                    products.map((product) => <CompanyProductCard key={product._id} product={product} />)
                )}
            </div>
        </>
    );
}
