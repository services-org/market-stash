import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    backHref?: string;
    children?: React.ReactNode;
};

export function PageHeader({ title, subtitle, action, backHref, children }: PageHeaderProps) {
    return (
        <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur-sm">
            <div className={cn("flex items-center justify-between px-4 pt-4", children ? "pb-2" : "pb-3")}>
                <div className="flex items-center gap-3">
                    {backHref && (
                        <Link href={backHref} className="flex size-8 items-center justify-center rounded-full hover:bg-accent">
                            <ArrowRight className="size-4" />
                        </Link>
                    )}
                    <div>
                        <h1 className="text-lg font-bold">{title}</h1>
                        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}
