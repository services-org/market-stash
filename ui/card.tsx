import { ReactNode } from "react";

import { Card as ShadCard, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardProps = {
    title?: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    footerClassName?: string;
};

export const Card = ({ title, description, children, footer, className, headerClassName, contentClassName, footerClassName }: CardProps) => {
    return (
        <ShadCard className={cn("overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md", className)}>
            {(title || description) && (
                <CardHeader className={headerClassName}>
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent className={contentClassName}>{children}</CardContent>
            {footer && <CardFooter className={footerClassName}>{footer}</CardFooter>}
        </ShadCard>
    );
};
