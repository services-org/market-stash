import { clsx, type ClassValue } from "clsx";
import { round } from "lodash";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Formats an amount as a whole number with thousands separators (the shop never uses fractions). */
export function formatNumber(value: number, decimals = 0) {
    return round(value, decimals).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Lower-cases and removes Arabic diacritics / letter variants so searching is forgiving. */
export function normalizeText(value: string | undefined | null) {
    return (value ?? "")
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
        .trim();
}

/** True when every word of `query` appears in at least one of the fields. */
export function matchesSearch(query: string, ...fields: (string | number | undefined | null)[]) {
    const words = normalizeText(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return true;
    const haystack = fields.map((f) => normalizeText(f === undefined || f === null ? "" : String(f))).join(" ");
    return words.every((word) => haystack.includes(word));
}
