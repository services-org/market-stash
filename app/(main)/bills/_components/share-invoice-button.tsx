"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { elementToPdf } from "@/lib/invoice-pdf";
import { whatsAppLink } from "@/lib/whatsapp";
import { billNet, billRemaining } from "@/lib/bill";
import { formatNumber } from "@/lib/utils";
import { TBill } from "@/server/models/bill";

import { InvoiceSheet, INVOICE_WIDTH_MM, INVOICE_WIDTH_PX } from "./invoice-sheet";

/** dd-mm-yyyy with Latin digits (safe in a file name). */
function formatFileDate(value: string | Date) {
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

/**
 * Sends the invoice as a PDF on WhatsApp. The PDF is prepared in the background from a hidden copy of the
 * invoice, so sharing is instant when the button is tapped (browsers only allow the share sheet right after a tap).
 */
export function ShareInvoiceButton({ bill }: Readonly<{ bill: TBill }>) {
    const sheetRef = useRef<HTMLDivElement>(null);
    // The result is tied to the bill it was made for, so an edited bill never reuses an old PDF
    const [result, setResult] = useState<{ bill: TBill; pdf?: Blob; failed?: boolean } | null>(null);
    const pdf = result?.bill === bill ? (result.pdf ?? null) : null;
    const failed = result?.bill === bill && !!result.failed;

    useEffect(() => {
        let cancelled = false;

        const timer = window.setTimeout(async () => {
            if (!sheetRef.current) return;
            try {
                const blob = await elementToPdf(sheetRef.current, INVOICE_WIDTH_MM);
                if (!cancelled) setResult({ bill, pdf: blob });
            } catch (error) {
                console.error(error);
                if (!cancelled) setResult({ bill, failed: true });
            }
        }, 400);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [bill]);

    const fileName = `Invoice ${formatFileDate(bill.createdAt)}.pdf`;

    async function share() {
        if (!pdf) return;

        const message = [
            `فاتورة ${bill.number ? `رقم ${bill.number} ` : ""}- ${bill.customerName}`,
            `الإجمالي: ${formatNumber(billNet(bill))} ج.م`,
            billRemaining(bill) > 0 ? `المتبقي: ${formatNumber(billRemaining(bill))} ج.م` : "",
        ]
            .filter(Boolean)
            .join("\n");

        const file = new File([pdf], fileName, { type: "application/pdf" });

        try {
            // Phones: opens the share sheet with the PDF attached, pick WhatsApp and the customer
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: fileName, text: message });
                return;
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            console.error(error);
        }

        // Fallback: save the PDF and open the customer's WhatsApp chat so the file can be attached
        const url = URL.createObjectURL(pdf);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);

        window.open(whatsAppLink(bill.phone, message), "_blank");
        toast.info("تم حفظ ملف PDF، أرفقه في محادثة واتساب");
    }

    const title = pdf ? "إرسال الفاتورة على واتساب" : failed ? "تعذر تجهيز الملف" : "جاري تجهيز الفاتورة...";

    return (
        <>
            <Button
                size="icon"
                onClick={share}
                disabled={!pdf}
                className="bg-[#25D366] text-white hover:bg-[#1ebe5b]"
                aria-label="إرسال الفاتورة على واتساب"
                title={title}
            >
                {pdf || failed ? <WhatsAppIcon className="size-5" /> : <Loader2 className="size-4 animate-spin" />}
            </Button>

            {/* Hidden copy of the invoice that the PDF is made from */}
            <div aria-hidden data-invoice-offscreen className="pointer-events-none absolute left-0 top-0 overflow-hidden" style={{ width: 0, height: 0 }}>
                <div ref={sheetRef} style={{ width: INVOICE_WIDTH_PX }}>
                    <InvoiceSheet bill={bill} />
                </div>
            </div>
        </>
    );
}
