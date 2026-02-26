import { ReactNode } from "react";

import { Tabs as ShadTabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type TabItem = {
    value: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
};

type TabsProps = {
    defaultValue?: string;
    items: TabItem[];
    className?: string;
    listClassName?: string;
    triggerClassName?: string;
    contentClassName?: string;
    onValueChange?: (value: string) => void;
};

export const Tabs = ({ defaultValue, items, className, listClassName, triggerClassName, contentClassName, onValueChange }: TabsProps) => {
    if (!items?.length) return null;

    return (
        <ShadTabs defaultValue={defaultValue ?? items[0].value} className={className} onValueChange={onValueChange}>
            <TabsList className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", listClassName)}>
                {items.map((item) => (
                    <TabsTrigger
                        key={item.value}
                        value={item.value}
                        disabled={item.disabled}
                        className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                            triggerClassName,
                        )}
                    >
                        {item.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {items.map((item) => (
                <TabsContent
                    key={item.value}
                    value={item.value}
                    className={cn(
                        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        contentClassName,
                    )}
                >
                    {item.content}
                </TabsContent>
            ))}
        </ShadTabs>
    );
};
