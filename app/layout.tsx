import type { Metadata, Viewport } from "next";
import { Marhey } from "next/font/google";
import "@/public/css/globals.css";

import { QueryProvider, ServiceWorkerRegister } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const marhey = Marhey({
    weight: ["300", "400", "500", "600", "700"],
    subsets: ["arabic"],
    variable: "--font-marhey",
});

export const metadata: Metadata = {
    title: "ابورقية",
    description: "إدارة المخزون والفواتير والعملاء",
    manifest: "/manifest.json",
    icons: { icon: "/images/icon-192.png", apple: "/images/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: "ابورقية", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
    themeColor: "#09090b",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
            <body className={`${marhey.variable} antialiased`} suppressHydrationWarning>
                <QueryProvider>{children}</QueryProvider>
                <Toaster position="top-center" richColors dir="rtl" />
                <ServiceWorkerRegister />
            </body>
        </html>
    );
}
