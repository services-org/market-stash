import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "@/public/css/globals.css";

export const metadata = {
    title: "abo-roqia",
    description: "abo-roqia",
    manifest: "/manifest.json",
    icons: {
        icon: "/images/logo.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
                <body className="antialiased" suppressHydrationWarning>
                    <QueryProvider>{children}</QueryProvider>
                    <Toaster position="top-center" richColors dir="rtl" />
                </body>
            </html>
        </ClerkProvider>
    );
}
