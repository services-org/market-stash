import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "@/public/css/globals.css";

export const metadata = {
    title: "أبو رقية",
    description: "إدارة متجر أبو رقية",
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
