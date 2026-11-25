"use client";
import { Package, House, Receipt, LineChart, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useGet } from "@/hooks/api";
import { Sheet } from "@/components/ui/sheet";

import { AppDrawer } from "./app-drawer";

/**
 * The main pages. Everything else (companies, customers, purchases...) lives in the side drawer.
 * The page is RTL, so the bar reads right to left: القائمة، المنتجات، الرئيسية، الفواتير، الاحصائيات.
 */
const NAV_ITEMS = [
    { href: "/products", label: "المنتجات", icon: Package },
    { href: "/", label: "الرئيسية", icon: House },
    { href: "/bills", label: "الفواتير", icon: Receipt },
    { href: "/analytics", label: "الاحصائيات", icon: LineChart },
];

/** "/" only matches the home page itself; the others match their sub-pages too. */
const isPathActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

const itemClass = "flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-xs transition-colors";

export function BottomNav() {
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // A red dot on the menu button when something needs attention (low stock)
    const { data: lowStock = [] } = useGet<unknown[]>("/api/products?type=low-stock", { queryKey: ["products", "low-stock"] });

    const isMainActive = NAV_ITEMS.some(({ href }) => isPathActive(pathname, href));

    return (
        <nav
            aria-label="التنقل الرئيسي"
            className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md items-stretch justify-around border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm print:hidden"
        >
            {/* A plain button (not Radix's trigger) keeps the server and client HTML identical */}
            <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen(true)}
                className={cn(itemClass, !isMainActive || drawerOpen ? "text-primary" : "text-muted-foreground")}
            >
                <span className="relative">
                    <Menu className="size-5" />
                    {lowStock.length > 0 && <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-destructive" />}
                </span>
                القائمة
            </button>

            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive = isPathActive(pathname, href);

                return (
                    <Link
                        key={href}
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(itemClass, isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                        <Icon className="size-5" />
                        {label}
                    </Link>
                );
            })}

            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <AppDrawer lowStockCount={lowStock.length} onNavigate={() => setDrawerOpen(false)} />
            </Sheet>
        </nav>
    );
}
