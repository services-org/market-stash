import { Card as ShadCard, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardProps = {
    children: React.ReactNode;
    className?: string;
};

export function Card({ children, className }: CardProps) {
    return (
        <ShadCard className={cn("gap-2 border-border/60 py-3 transition-shadow hover:shadow-md", className)}>
            <CardContent className="px-4">{children}</CardContent>
        </ShadCard>
    );
}
