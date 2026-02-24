import { BottomNav } from "./_components";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto min-h-screen max-w-md bg-background pb-20">
            {children}
            <BottomNav />
        </div>
    );
}
