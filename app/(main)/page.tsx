"use client";
import { AlertTriangle, ClipboardCheck, FileText, PackagePlus, Receipt, ShoppingCart, Wallet, Banknote, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";

import { AddProductDialog } from "./products/_components/add-product-dialog";
import { CreatePurchaseDialog } from "./purchases/_components/create-purchase-dialog";
import { CreateBillDialog } from "./bills/_components/create-bill-dialog";
import { AddExpenseDialog } from "./expenses/add-expense-dialog";
import { PageHeader } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import type { TDailyReport } from "@/server/actions/report";
import type { TCustomer } from "@/server/actions/customer";
import type { TPurchase } from "@/server/models/purchase";
import { formatNumber, cn } from "@/lib/utils";
import { useGet } from "@/hooks/api";

const tileClass = "flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center text-xs font-semibold transition-colors hover:bg-accent";

function Tile({ icon: Icon, label, tone }: Readonly<{ icon: LucideIcon; label: string; tone?: string }>) {
    return (
        <>
            <span className={cn("flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary", tone)}>
                <Icon className="size-5" />
            </span>
            {label}
        </>
    );
}

function Kpi({ label, value, hint, href, tone }: Readonly<{ label: string; value?: number; hint?: string; href?: string; tone?: "good" | "bad" }>) {
    const body = (
        <>
            <p className="text-xs text-muted-foreground">{label}</p>
            {value === undefined ? (
                <Skeleton className="mt-1 h-6 w-20" />
            ) : (
                <p className={cn("mt-1 font-mono text-lg font-bold", tone === "good" && "text-emerald-500", tone === "bad" && "text-destructive")}>
                    {formatNumber(value)} <span className="text-xs font-normal">ج.م</span>
                </p>
            )}
            {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </>
    );
    const cls = "rounded-2xl border border-border/60 bg-card p-3";
    return href ? (
        <Link href={href} className={cn(cls, "block hover:bg-accent")}>
            {body}
        </Link>
    ) : (
        <div className={cls}>{body}</div>
    );
}

/** Home: today at a glance + the shortcuts used most. */
export default function HomePage() {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    const today = from.toISOString().slice(0, 10) + "|" + from.getTime();

    const { data: report } = useGet<TDailyReport>(`/api/reports/daily?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`, {
        queryKey: ["analytics", "daily", today],
    });
    const { data: customers } = useGet<TCustomer[]>("/api/customers", { queryKey: ["customers"] });
    const { data: lowStock } = useGet<unknown[]>("/api/products?type=low-stock", { queryKey: ["products", "low-stock"] });
    const { data: purchases } = useGet<TPurchase[]>("/api/purchases", { queryKey: ["purchases"] });

    const debts = customers?.reduce((sum, c) => sum + c.balance, 0);
    const debtors = customers?.filter((c) => c.balance > 0).length;
    const owed = purchases?.reduce((sum, p) => sum + Math.max(0, p.total - p.paid), 0);

    const label = from.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });

    const actions: { key: string; node: ReactNode }[] = [
        { key: "bill", node: <CreateBillDialog trigger={<button className={tileClass}><Tile icon={Receipt} label="فاتورة جديدة" /></button>} /> },
        {
            key: "collect",
            node: (
                <Link href="/customers?tab=debt" className={tileClass}>
                    <Tile icon={Wallet} label="تحصيل من عميل" />
                </Link>
            ),
        },
        { key: "product", node: <AddProductDialog trigger={<button className={tileClass}><Tile icon={PackagePlus} label="إضافة منتج" /></button>} /> },
        { key: "purchase", node: <CreatePurchaseDialog trigger={<button className={tileClass}><Tile icon={ShoppingCart} label="فاتورة شراء" /></button>} /> },
        { key: "expense", node: <AddExpenseDialog trigger={<button className={tileClass}><Tile icon={Banknote} label="مصروف" /></button>} /> },
        {
            key: "stocktake",
            node: (
                <Link href="/stocktake" className={tileClass}>
                    <Tile icon={ClipboardCheck} label="جرد المخزن" />
                </Link>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="الرئيسية" subtitle={label} />

            <div className="space-y-5 p-4 pb-24">
                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-muted-foreground">اليوم</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Kpi label="مبيعات اليوم" value={report?.sales} hint={report ? `${report.billsCount} فاتورة` : undefined} />
                        <Kpi label="المحصّل اليوم" value={report?.collected} tone="good" />
                        <Kpi label="ديون جديدة اليوم" value={report?.newDebt} tone={report && report.newDebt > 0 ? "bad" : undefined} />
                        <Kpi label="مصروفات اليوم" value={report?.expenses} />
                    </div>
                    <Link href="/reports/daily" className="flex items-center justify-center gap-2 rounded-xl border border-border/60 p-3 text-sm font-semibold hover:bg-accent">
                        <FileText className="size-4" />
                        تقفيل اليوم وإرسال الملخص
                    </Link>
                </section>

                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-muted-foreground">يحتاج انتباهك</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Kpi label="مديونيات العملاء" value={debts} hint={debtors === undefined ? undefined : `${debtors} عميل`} href="/customers?tab=debt" tone={debts ? "bad" : undefined} />
                        <Kpi label="مستحق للموردين" value={owed} href="/purchases" tone={owed ? "bad" : undefined} />
                    </div>
                    {lowStock && lowStock.length > 0 && (
                        <Link href="/low-stock" className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
                            <AlertTriangle className="size-5" />
                            {lowStock.length} منتج قارب على النفاد
                        </Link>
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-muted-foreground">اختصارات</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {actions.map(({ key, node }) => (
                            <div key={key} className="contents">
                                {node}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
