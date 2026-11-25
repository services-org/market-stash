"use client";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type BarDatum = { label: string; value: number; detail?: string };

type BarChartProps = {
    data: BarDatum[];
    /** Accessible name of the chart (also used as the table caption). */
    title: string;
    /** Formats a value for the y-axis and the readout. */
    format: (value: number) => string;
    height?: number;
    /** Show every n-th x label (keeps the axis legible on a phone). */
    labelEvery?: number;
};

/**
 * Single-series bar chart. Bars are anchored to the baseline with rounded data-ends, tapping a bar
 * shows its exact value above the chart (no number on every bar), and a screen-reader table
 * carries the same data. Negative values are drawn in the destructive colour.
 */
export function BarChart({ data, title, format, height = 140, labelEvery = 1 }: Readonly<BarChartProps>) {
    const [selected, setSelected] = useState<number | null>(null);

    const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
    const active = selected !== null ? data[selected] : data[data.length - 1];

    return (
        <figure className="space-y-3">
            <figcaption className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted-foreground">{active?.detail ?? active?.label}</span>
                <span className={cn("font-mono text-base font-bold", active && active.value < 0 ? "text-destructive" : "text-foreground")}>
                    {active ? format(active.value) : "-"}
                </span>
            </figcaption>

            <div role="img" aria-label={title} className="relative" style={{ height }}>
                {/* Recessive grid: baseline + top line with the max value */}
                <div className="absolute inset-x-0 top-0 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-mono">{format(max)}</span>
                    <span className="h-px flex-1 bg-border/60" />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-border" />

                <div className="absolute inset-x-0 bottom-0 top-4 flex items-end gap-0.5">
                    {data.map((d, i) => {
                        const pct = Math.max((Math.abs(d.value) / max) * 100, d.value === 0 ? 0 : 2);
                        const isActive = (selected ?? data.length - 1) === i;
                        return (
                            <button
                                key={`${d.label}-${i}`}
                                type="button"
                                aria-label={`${d.label}: ${format(d.value)}`}
                                aria-pressed={selected === i}
                                onClick={() => setSelected(selected === i ? null : i)}
                                className="flex h-full min-w-0 flex-1 items-end"
                            >
                                <span
                                    className={cn(
                                        "w-full rounded-t-[4px] transition-opacity",
                                        d.value < 0 ? "bg-destructive" : "bg-primary",
                                        isActive ? "opacity-100" : "opacity-45",
                                    )}
                                    style={{ height: `${pct}%` }}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-0.5 text-[10px] text-muted-foreground" aria-hidden>
                {data.map((d, i) => (
                    <span key={`${d.label}-${i}`} className="min-w-0 flex-1 truncate text-center">
                        {i % labelEvery === 0 ? d.label : ""}
                    </span>
                ))}
            </div>

            <table className="sr-only">
                <caption>{title}</caption>
                <tbody>
                    {data.map((d, i) => (
                        <tr key={`${d.label}-${i}`}>
                            <th scope="row">{d.label}</th>
                            <td>{format(d.value)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}
