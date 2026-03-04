import { ClerkProvider } from "@clerk/nextjs";
import { Marhey } from "next/font/google";
import "@/public/css/globals.css";

import { QueryProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const marhey = Marhey({
    weight: ["300", "400", "500", "600", "700"],
    subsets: ["arabic"],
    variable: "--font-marhey",
});

export const metadata = {
    title: "abo-roqia",
    description: "abo-roqia",
    manifest: "/manifest.json",
    icons: { icon: "/images/logo.png" },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
                <body className={`${marhey.variable} antialiased`} suppressHydrationWarning>
                    <QueryProvider>{children}</QueryProvider>
                    <Toaster position="top-center" richColors dir="rtl" />
                </body>
            </html>
        </ClerkProvider>
    );
}
