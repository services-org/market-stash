"use client";
import { useParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { TBill } from "@/server/models/bill";
import { useGet } from "@/hooks/api";

export default function PrintBillPage() {
    const { id } = useParams<{ id: string }>();

    const { data: bill, isPending } = useGet<TBill>(`/api/bills/${id}`, {
        queryKey: ["bill", id],
    });

    if (isPending) {
        return (
            <div className="fixed inset-0 z-50 overflow-auto bg-background p-5 print:bg-white">
                <div className="mx-auto max-w-3xl space-y-4">
                    <Skeleton className="mx-auto h-20 w-20 rounded-full" />
                    <Skeleton className="mx-auto h-6 w-48" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </div>
        );
    }

    if (!bill) return null;

    const date = new Date(bill.createdAt).toLocaleDateString("ar-EG", {
        minute: "2-digit",
        year: "numeric",
        hour: "2-digit",
        day: "numeric",
        month: "long",
    });

    return (
        <div className="mx-auto p-5 text-foreground print:text-black not-print:max-w-3xl" dir="rtl">
            {/* Header */}
            <div className="mb-6 border-b-[3px] border-orange-500 pb-5 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo.png" alt="logo" className="mx-auto mb-3 block" height={80} width={80} />
                <h1 className="mb-1 text-[22px] font-extrabold print:text-black">ابو رقية للتجارة والتوزيع</h1>
                <p className="text-xs leading-relaxed text-muted-foreground print:text-gray-500">الورديان - نهاية شارع الامير لؤلؤ - موقف المتراس</p>
            </div>

            {/* Bill Meta */}
            <div className="mb-5 flex justify-between rounded-lg border border-border/60 bg-muted/50 px-4 py-3 print:border-gray-200 print:bg-gray-50">
                <div className="text-[13px]">
                    <strong className="mb-0.5 block text-[11px] font-semibold text-muted-foreground print:text-black">العميل</strong>
                    {bill.customerName}
                </div>
                <div className="text-[13px]">
                    <strong className="mb-0.5 block text-[11px] font-semibold text-muted-foreground print:text-black">التاريخ</strong>
                    {date}
                </div>
            </div>

            {/* Items Table */}
            <table className="mb-5 w-full border-collapse">
                <thead>
                    <tr>
                        <th className="rounded-r-lg bg-orange-500 px-3 py-2.5 text-center text-xs font-bold text-white">#</th>
                        <th className="bg-orange-500 px-3 py-2.5 text-right text-xs font-bold text-white">المنتج</th>
                        <th className="bg-orange-500 px-3 py-2.5 text-center text-xs font-bold text-white">الكمية</th>
                        <th className="bg-orange-500 px-3 py-2.5 text-center text-xs font-bold text-white">السعر</th>
                        <th className="rounded-l-lg bg-orange-500 px-3 py-2.5 text-center text-xs font-bold text-white">المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.items.map((item, i) => (
                        <tr key={i} className="even:bg-muted/30 print:even:bg-gray-100">
                            <td className="border-b border-border/40 px-3 py-2.5 text-center font-mono text-[13px] print:border-gray-200">{i + 1}</td>
                            <td className="border-b border-border/40 px-3 py-2.5 text-[13px] print:border-gray-200">{item.name}</td>
                            <td className="border-b border-border/40 px-3 py-2.5 text-center font-mono text-[13px] print:border-gray-200">
                                {item.count}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2.5 text-center font-mono text-[13px] print:border-gray-200">
                                {formatNumber(item.price)}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2.5 text-center font-mono text-[13px] font-bold print:border-gray-200">
                                {formatNumber(item.price * item.count)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Total */}
            <div className="flex items-center justify-between rounded-[10px] bg-linear-to-br from-orange-500 to-orange-600 px-5 py-4 text-lg font-extrabold text-white">
                <span>الإجمالي</span>
                <span>{formatNumber(bill.total)} ج.م</span>
            </div>

            {/* Print Button */}
            <button
                className="mx-auto mt-6 block cursor-pointer rounded-lg border-none bg-orange-500 px-8 py-2.5 text-sm font-bold text-white hover:bg-orange-600 print:hidden"
                onClick={window.print}
            >
                طباعة الفاتورة
            </button>
        </div>
    );
}
