import { clsx, type ClassValue } from "clsx";
import { round } from "lodash";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals = 2) {
    return round(value, decimals).toFixed(decimals);
}
