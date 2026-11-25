"use client";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

type SearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export function SearchInput({ value, onChange, placeholder = "بحث...", className }: Readonly<SearchInputProps>) {
    return (
        <div className={cn("relative", className)}>
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-10 w-full rounded-xl border border-border/60 bg-muted/40 pe-9 ps-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background [&::-webkit-search-cancel-button]:hidden"
            />
            {value && (
                <button
                    type="button"
                    aria-label="مسح البحث"
                    onClick={() => onChange("")}
                    className="absolute left-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
                >
                    <X className="size-3.5" />
                </button>
            )}
        </div>
    );
}
