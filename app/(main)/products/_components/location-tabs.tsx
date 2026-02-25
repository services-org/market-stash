"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type LocationTabsProps = {
    locations: string[];
    active: string | null;
    onSelect: (location: string | null) => void;
};

export function LocationTabs({ locations, active, onSelect }: LocationTabsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
            <Badge
                variant={active === null ? "default" : "outline"}
                onClick={() => onSelect(null)}
                className={cn(
                    "cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs transition-all",
                    active === null ? "shadow-sm" : "hover:bg-accent",
                )}
            >
                الكل
            </Badge>
            {locations.map((location) => {
                const isActive = active === location;
                return (
                    <Badge
                        key={location}
                        variant={isActive ? "default" : "outline"}
                        className={cn(
                            "cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs transition-all",
                            isActive ? "shadow-sm" : "hover:bg-accent",
                        )}
                        onClick={() => onSelect(location)}
                    >
                        {location}
                    </Badge>
                );
            })}
        </div>
    );
}
