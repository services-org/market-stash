"use client";
import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type Section = { id: string; title: string; hint?: string; icon?: ReactNode; content: ReactNode };

/**
 * Collapsible sections: all closed at first, the user opens what they want (several can be open at once).
 * A section's content is only mounted once it has been opened, so closed sections cost no requests.
 */
export function AccordionSections({ sections }: Readonly<{ sections: Section[] }>) {
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const [everOpened, setEverOpened] = useState<Record<string, boolean>>({});
    const baseId = useId();

    const toggle = (id: string) => {
        setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
        setEverOpened((prev) => ({ ...prev, [id]: true }));
    };

    return (
        <div className="space-y-3">
            {sections.map(({ id, title, hint, icon, content }) => {
                const isOpen = !!open[id];
                const panelId = `${baseId}-${id}`;

                return (
                    <section key={id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                        <h2>
                            <button
                                type="button"
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                onClick={() => toggle(id)}
                                className="flex w-full items-center gap-3 px-4 py-4 text-start transition-colors hover:bg-muted/40"
                            >
                                {icon && <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>}
                                <span className="flex-1">
                                    <span className="block text-base font-bold">{title}</span>
                                    {hint && <span className="block text-xs font-normal text-muted-foreground">{hint}</span>}
                                </span>
                                <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                            </button>
                        </h2>

                        <div id={panelId} hidden={!isOpen} className="border-t px-4 py-4">
                            {everOpened[id] && content}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
