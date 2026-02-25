import { BottomNav } from "./_components";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto min-h-screen max-w-md bg-background pb-20 print:max-w-none print:pb-0">
            {children}
            <BottomNav />
        </div>
    );
}
