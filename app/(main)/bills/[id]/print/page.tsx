"use client";
import { useParams } from "next/navigation";
import Image from "next/image";

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

    const deliveryDate = bill.deliveryDate
        ? new Date(bill.deliveryDate).toLocaleDateString("ar-EG", { year: "numeric", day: "numeric", month: "long" })
        : "";

    return (
        <div className="mx-auto p-5 font-bold text-foreground print:text-black not-print:max-w-3xl" dir="rtl">
            {/* Header */}
            <div className="mb-5 border-b-[3px] border-orange-500 pb-4 text-center">
                <Image
                    src="/images/banner.jpeg"
                    alt="الراية للتجارة والتوزيع"
                    width={1024}
                    height={1024}
                    priority
                    className="mx-auto block h-44 w-auto object-contain"
                />
                <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground print:text-black">
                    الورديان - نهاية شارع الامير لؤلؤ - موقف المتراس
                </p>
            </div>

            {/* Bill Meta */}
            <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border/60 bg-muted/50 px-4 py-3 print:border-gray-400 print:bg-gray-50">
                {[
                    { label: "العميل", value: bill.customerName },
                    { label: "رقم الهاتف", value: bill.phone },
                    { label: "العنوان", value: bill.address },
                    { label: "تاريخ التسليم", value: deliveryDate },
                    { label: "المندوب", value: bill.representative },
                ].map(({ label, value }) => (
                    <div key={label} className="flex items-baseline gap-2 text-base font-extrabold print:text-black">
                        <span className="shrink-0 text-sm font-extrabold text-muted-foreground print:text-black">{label}:</span>
                        <span className="min-h-6 flex-1 border-b border-dotted border-gray-400">{value}</span>
                    </div>
                ))}
            </div>

            {/* Items Table */}
            <table className="mb-5 w-full border-collapse">
                <thead>
                    <tr>
                        <th className="rounded-r-lg bg-orange-500 px-3 py-2.5 text-center text-sm font-extrabold text-white">#</th>
                        <th className="bg-orange-500 px-3 py-2.5 text-right text-sm font-extrabold text-white">المنتج</th>
                        <th className="bg-orange-500 px-3 py-2.5 text-center text-sm font-extrabold text-white">الكمية</th>
                        <th className="bg-orange-500 px-3 py-2.5 text-center text-sm font-extrabold text-white">السعر</th>
                        <th className="rounded-l-lg bg-orange-500 px-3 py-2.5 text-center text-sm font-extrabold text-white">المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.items.map((item, i) => (
                        <tr key={i} className="even:bg-muted/30 print:even:bg-gray-100">
                            <td className="border-b border-border/40 px-3 py-2.5 text-center font-mono text-[15px] font-bold print:border-gray-200">{i + 1}</td>
                            <td className="border-b border-border/40 px-3 py-2.5 text-[15px] font-bold print:border-gray-200">{item.name}</td>
                            <td className="border-b border-border/40 px-3 py-2.5 text-center font-mono text-[15px] font-bold print:border-gray-200">
                                {item.count}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2.5 text-center font-mono text-[15px] font-bold print:border-gray-200">
                                {formatNumber(item.price)}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2.5 text-center font-mono text-[15px] font-bold print:border-gray-200">
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
