"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfitItem } from "./profit-item";
import { TProfitData } from "./types";

interface ProfitSectionProps {
    title: string;
    items: TProfitData[];
    type: "yearly" | "monthly" | "daily";
    defaultVisibleCount?: number;
    maxVisibleCount?: number;
}

export function ProfitSection({ title, items, type, defaultVisibleCount = 1, maxVisibleCount = 30 }: ProfitSectionProps) {
    const [showAll, setShowAll] = useState(false);

    if (!items || items.length === 0) return null;

    const visibleItems = items.slice(0, showAll ? maxVisibleCount : defaultVisibleCount);
    const hasMore = items.length > defaultVisibleCount;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">{title}</h3>
            <div className="flex flex-col gap-4">
                {visibleItems.map((p) => (
                    <ProfitItem
                        key={type === "yearly" ? p.year : type === "monthly" ? `${p.year}-${p.month}` : `${p.year}-${p.month}-${p.day}`}
                        data={p}
                        type={type}
                    />
                ))}

                {hasMore && (
                    <Button variant="outline" className="w-full" onClick={() => setShowAll((prev) => !prev)}>
                        {showAll ? "عرض أقل" : "عرض المزيد"}
                    </Button>
                )}
            </div>
        </div>
    );
}
