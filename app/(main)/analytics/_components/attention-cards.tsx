"use client";
import { PackageX, Moon, Users } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { TCustomer } from "@/server/actions/customer";
import { TProduct } from "@/server/models/product";
import { formatNumber } from "@/lib/utils";
import { useGet } from "@/hooks/api";

function CardShell({ children, footerHref, footerLabel }: Readonly<{ children: React.ReactNode; footerHref?: string; footerLabel?: string }>) {
    return (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="divide-y divide-border">{children}</div>
            {footerHref && (
                <Link href={footerHref} className="block border-t py-2.5 text-center text-xs font-semibold text-primary hover:bg-muted/50">
                    {footerLabel}
                </Link>
            )}
        </div>
    );
}

function Empty({ icon: Icon, text }: Readonly<{ icon: typeof PackageX; text: string }>) {
    return (
        <div className="flex h-28 flex-col items-center justify-center rounded-2xl border border-dashed bg-accent/30 text-muted-foreground">
            <Icon className="mb-2 size-7 text-muted-foreground/50" />
            <p className="text-sm">{text}</p>
        </div>
    );
}

export function LowStockCard() {
    const { data: products = [], isPending } = useGet<TProduct[]>("/api/products?type=low-stock", { queryKey: ["products", "low-stock"] });

    if (isPending) return <Skeleton className="h-32 w-full rounded-2xl" />;
    if (products.length === 0) return <Empty icon={PackageX} text="لا توجد منتجات وصلت لحد التنبيه" />;

    return (
        <CardShell footerHref="/low-stock" footerLabel={`عرض الكل (${products.length})`}>
            {products.slice(0, 5).map((p) => (
                <div key={p._id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                            {p.company} • {p.location}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant={p.count <= 0 ? "destructive" : "secondary"} className="font-mono text-xs">
                            {p.count <= 0 ? "نفذ" : p.count}
                        </Badge>
                        <span className="text-xs text-muted-foreground">الحد {p.minStock}</span>
                    </div>
                </div>
            ))}
        </CardShell>
    );
}

type TDeadProduct = { _id: string; name: string; company: string; location: string; count: number; value: number };

export function DeadStockCard() {
    const { data: products = [], isPending } = useGet<TDeadProduct[]>("/api/analytics/dead-stock", { queryKey: ["analytics", "dead-stock"] });

    if (isPending) return <Skeleton className="h-32 w-full rounded-2xl" />;
    if (products.length === 0) return <Empty icon={Moon} text="لا توجد منتجات راكدة" />;

    return (
        <CardShell>
            {products.slice(0, 8).map((p) => (
                <div key={p._id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                            {p.company} • {p.location} • {p.count} وحدة
                        </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold">{formatNumber(p.value, 0)} ج.م</span>
                </div>
            ))}
        </CardShell>
    );
}

export function TopCustomersCard() {
    const { data: customers = [], isPending } = useGet<TCustomer[]>("/api/customers", { queryKey: ["customers"] });

    if (isPending) return <Skeleton className="h-32 w-full rounded-2xl" />;
    if (customers.length === 0) return <Empty icon={Users} text="لا يوجد عملاء بعد" />;

    const top = customers.toSorted((a, b) => b.totalNet - a.totalNet).slice(0, 5);

    return (
        <CardShell footerHref="/customers" footerLabel="عرض كل العملاء">
            {top.map((c, i) => (
                <Link
                    key={c._id}
                    href={`/customers/${encodeURIComponent(c._id)}`}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50"
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{c._id}</p>
                            <p className="text-xs text-muted-foreground">{c.billsCount} فاتورة</p>
                        </div>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold">{formatNumber(c.totalNet, 0)} ج.م</span>
                </Link>
            ))}
        </CardShell>
    );
}
