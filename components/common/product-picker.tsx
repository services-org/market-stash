"use client";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { BarcodeScanButton } from "@/components/common/barcode-scanner";
import { SearchInput } from "@/components/common/search-input";
import { TProduct } from "@/server/models/product";
import { cn, matchesSearch } from "@/lib/utils";

type ProductPickerProps = {
    products: TProduct[];
    value?: string;
    disabled?: boolean;
    placeholder?: string;
    /** Out-of-stock products can be picked too (e.g. when buying stock). */
    allowOutOfStock?: boolean;
    onSelect: (product: TProduct) => void;
    /** Called when a scanned barcode matches no product. */
    onUnknownBarcode?: (code: string) => void;
};

/** Searchable product list (name, company or barcode) with an optional camera barcode scanner. */
export function ProductPicker({ products, value, disabled, placeholder = "اختر المنتج", allowOutOfStock, onSelect, onUnknownBarcode }: Readonly<ProductPickerProps>) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const selected = products.find((p) => p._id === value);

    const filtered = useMemo(
        () => products.filter((p) => matchesSearch(query, p.company, p.name, p.barcode)).slice(0, 60),
        [products, query],
    );

    function choose(product: TProduct) {
        onSelect(product);
        setOpen(false);
        setQuery("");
    }

    function handleScan(code: string) {
        const product = products.find((p) => p.barcode === code);
        if (product && (allowOutOfStock || product.count > 0)) return choose(product);
        if (product) return setQuery(code);
        setQuery(code);
        onUnknownBarcode?.(code);
    }

    return (
        <div className="w-full space-y-2">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs disabled:cursor-not-allowed disabled:opacity-50",
                    !selected && "text-muted-foreground",
                )}
            >
                <span className="truncate">{selected ? `${selected.company} - ${selected.name}` : placeholder}</span>
                <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
            </button>

            {open && (
                <div className="space-y-2 rounded-xl border border-border/60 bg-card p-2">
                    <div className="flex items-center gap-2">
                        <SearchInput className="flex-1" value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الشركة أو الباركود" />
                        <BarcodeScanButton onScan={handleScan} className="size-10 shrink-0" />
                    </div>

                    <div className="max-h-56 space-y-1 overflow-y-auto">
                        {filtered.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">لا توجد نتائج</p>}
                        {filtered.map((p) => {
                            const out = !allowOutOfStock && p.count <= 0;
                            return (
                                <button
                                    key={p._id}
                                    type="button"
                                    disabled={out}
                                    onClick={() => choose(p)}
                                    className={cn(
                                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-right text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40",
                                        p._id === value && "bg-accent",
                                    )}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate font-semibold">{p.name}</span>
                                        <span className="block truncate text-xs text-muted-foreground">{p.company} • {p.location}</span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-2 text-xs">
                                        <span className={cn("font-mono font-bold", out ? "text-destructive" : "text-foreground")}>{p.count <= 0 ? "نفذ" : `متاح: ${p.count}`}</span>
                                        {p._id === value && <Check className="size-4 text-primary" />}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
