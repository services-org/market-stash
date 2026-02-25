type EmptyStateProps = {
    message: string;
    className?: string;
};

export function EmptyState({ message, className }: EmptyStateProps) {
    return <div className={`py-16 text-center text-sm text-muted-foreground ${className ?? ""}`}>{message}</div>;
}
