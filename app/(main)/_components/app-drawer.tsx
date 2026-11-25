"use client";
import { Banknote, Building2, ClipboardCheck, Download, FileText, House, LineChart, Package, PackageX, Receipt, ShoppingCart, Users, Wallet, type LucideIcon } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type DrawerLink = { href: string; label: string; hint: string; icon: LucideIcon; badge?: number };

type AppDrawerProps = {
    lowStockCount: number;
    onNavigate: () => void;
};

export function AppDrawer({ lowStockCount, onNavigate }: Readonly<AppDrawerProps>) {
    const pathname = usePathname();

    const sections: { title: string; links: DrawerLink[] }[] = [
        {
            title: "الرئيسية",
            links: [
                { href: "/", label: "الرئيسية", hint: "ملخص اليوم واختصارات سريعة", icon: House },
                { href: "/bills", label: "الفواتير", hint: "إنشاء ومتابعة الفواتير", icon: Receipt },
                { href: "/products", label: "المنتجات", hint: "كل المنتجات في المخازن", icon: Package },
                { href: "/companies", label: "الشركات", hint: "المنتجات حسب الشركة", icon: Building2 },
                { href: "/analytics", label: "الاحصائيات", hint: "المبيعات والأرباح", icon: LineChart },
            ],
        },
        {
            title: "العملاء والحسابات",
            links: [
                { href: "/customers", label: "العملاء", hint: "كشف حساب كل عميل", icon: Users },
                { href: "/customers?tab=debt", label: "المديونيات", hint: "العملاء الذين عليهم مبالغ", icon: Wallet },
            ],
        },
        {
            title: "المخزون والمشتريات",
            links: [
                { href: "/purchases", label: "المشتريات", hint: "فواتير الشراء من الموردين", icon: ShoppingCart },
                { href: "/stocktake", label: "جرد المخزن", hint: "مطابقة الكميات الفعلية", icon: ClipboardCheck },
                { href: "/low-stock", label: "مخزون منخفض", hint: "المنتجات التي قاربت على النفاد", icon: PackageX, badge: lowStockCount },
            ],
        },
        {
            title: "الحسابات",
            links: [
                { href: "/expenses", label: "المصروفات", hint: "إيجار ومرتبات ومصاريف أخرى", icon: Banknote },
                { href: "/reports/daily", label: "تقفيل اليوم", hint: "ملخص المبيعات والتحصيل", icon: FileText },
            ],
        },
        {
            title: "أدوات",
            links: [{ href: "/tools", label: "تصدير البيانات", hint: "ملفات Excel للمنتجات والفواتير", icon: Download }],
        },
    ];

    return (
        <SheetContent aria-describedby={undefined}>
            <div className="flex items-center gap-3 border-b border-border/60 px-4 pb-4 pt-5">
                <UserButton />
                <div className="min-w-0">
                    <SheetTitle>ابورقية للتجارة والتوزيع</SheetTitle>
                    <p className="text-xs text-muted-foreground">حسابي</p>
                </div>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="القائمة">
                {sections.map((section) => (
                    <div key={section.title} className="space-y-1">
                        <h2 className="px-2 pb-1 text-xs font-semibold text-muted-foreground">{section.title}</h2>
                        {section.links.map(({ href, label, hint, icon: Icon, badge }) => {
                            const path = href.split("?")[0];
                            const isActive = !href.includes("?") && (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`));

                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={onNavigate}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent",
                                        isActive && "bg-primary/10 text-primary",
                                    )}
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Icon className="size-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold">{label}</span>
                                        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                                    </span>
                                    {badge ? (
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-white">
                                            {badge}
                                        </span>
                                    ) : null}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>
        </SheetContent>
    );
}
