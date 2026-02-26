"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Building2, Receipt, LineChart } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { href: "/products", label: "المنتجات", icon: Package },
    { href: "/companies", label: "الشركات", icon: Building2 },
    { href: "user", label: "الحساب", icon: Building2 },
    { href: "/bills", label: "الفواتير", icon: Receipt },
    { href: "/analytics", label: "الاحصائيات", icon: LineChart },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-sm print:hidden">
            <div className="mx-auto flex max-w-md items-center justify-around py-2">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname.startsWith(href);

                    if (href === "user") {
                        return (
                            <div key={href} className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground">
                                <UserButton fallback="/sign-in" />
                                <span>{label}</span>
                            </div>
                        );
                    }
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <Icon className="size-5" />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
