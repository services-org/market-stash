import Image from "next/image";

import { TBill } from "@/server/models/bill";
import { billNet, billPaid, billRemaining, billReturned } from "@/lib/bill";
import { formatNumber } from "@/lib/utils";

/** The invoice is an 80mm thermal roll: width in millimetres and in CSS pixels (96dpi). */
export const INVOICE_WIDTH_MM = 80;
export const INVOICE_WIDTH_PX = 302;

// Brand colours, taken from the logo (royal blue + gold)
const NAVY = "#12306b";
// Soft tint of the brand blue, used instead of solid dark fills
const TINT_STRONG = "rgba(18, 48, 107, 0.14)";
const GOLD = "#c9970a";

const formatDate = (value: string | Date) => new Date(value).toLocaleDateString("ar-EG", { year: "numeric", day: "numeric", month: "long" });

/**
 * The printable invoice. It always uses a white "paper" look (independent of the app theme) so the
 * generated PDF looks the same everywhere.
 */
export function InvoiceSheet({ bill }: Readonly<{ bill: TBill }>) {
    const net = billNet(bill);
    const paid = billPaid(bill);
    const remaining = billRemaining(bill);
    const discount = bill.discount ?? 0;
    const returned = billReturned(bill);
    const settled = remaining <= 0;
    // Old bills may have no number yet: fall back to the short id so the invoice always has one
    const invoiceNo = bill.number ? `#${bill.number}` : `#${bill._id.slice(-6).toUpperCase()}`;

    const customer = [
        { label: "العميل", value: bill.customerName },
        { label: "رقم الهاتف", value: bill.phone, ltr: true },
        { label: "العنوان", value: bill.address },
        { label: "المندوب", value: bill.representative },
    ];

    const dates = [
        { label: "تاريخ الفاتورة", value: formatDate(bill.createdAt) },
        { label: "تاريخ التسليم", value: bill.deliveryDate ? formatDate(bill.deliveryDate) : "" },
    ];

    return (
        <div dir="rtl" className="bg-white p-3 text-[12px] font-bold text-black" style={{ width: "100%" }}>
            <header className="flex items-center justify-between gap-3">
                <Image
                    src="/images/banner.jpeg"
                    alt="الراية للتجارة والتوزيع"
                    width={1254}
                    height={1254}
                    priority
                    unoptimized
                    className="shrink-0 rounded-2xl object-cover"
                    style={{ width: 68, height: 68, boxShadow: `0 0 0 3px ${GOLD}` }}
                />

                <div className="flex-1" style={{ textAlign: "left" }}>
                    <h1 className="text-[22px] font-extrabold leading-none" style={{ color: NAVY }}>
                        فاتورة بيع
                    </h1>
                    <p className="mt-2 flex items-center gap-2" style={{ justifyContent: "flex-end", direction: "rtl" }}>
                        <span className="text-gray-600">رقم</span>
                        <span dir="ltr" className="inline-block font-mono font-extrabold" style={{ color: GOLD, fontSize: 16 }}>
                            {invoiceNo}
                        </span>
                        <span className="rounded-full px-3 py-0.5 text-[10px] font-extrabold text-white" style={{ background: settled ? "#15803d" : "#b45309" }}>
                            {settled ? "مسددة" : "مسددة جزئياً"}
                        </span>
                    </p>
                </div>
            </header>

            {/* Invoice date and delivery date */}
            <div className="my-4 flex flex-col gap-1">
                {dates.map(({ label, value }) => (
                    <div key={label} className="flex flex-1 items-baseline gap-2">
                        <span className="shrink-0 text-[10px] text-gray-500">{label}:</span>
                        <span className="min-h-6 flex-1 border-b border-dotted border-gray-400 pb-0.5">{value}</span>
                    </div>
                ))}
            </div>

            {/* Customer */}
            <section className="mb-4 rounded-xl border-2 p-4" style={{ borderColor: NAVY }}>
                <h2 className="mb-3 text-[10px] font-extrabold" style={{ color: GOLD }}>
                    بيانات العميل
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {customer.map(({ label, value, ltr }) => (
                        <div key={label}>
                            <p className="text-[10px] text-gray-500">{label}</p>
                            <p
                                dir={ltr ? "ltr" : undefined}
                                className="min-h-7 border-b border-dotted border-gray-400 pb-0.5 text-[12.5px] font-extrabold"
                                style={ltr ? { textAlign: "right" } : undefined}
                            >
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Notes (only when there are notes) */}
            {bill.notes && (
                <div className="mb-4 rounded-xl border border-gray-300 p-3">
                    <p className="mb-1 text-[10px] text-gray-500">ملاحظات</p>
                    <p className="text-[12.5px]">{bill.notes}</p>
                </div>
            )}

            {/* Totals */}
            <div className="mb-4 overflow-hidden rounded-xl border border-gray-300">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                    <span className="text-gray-600">إجمالي الأصناف</span>
                    <span className="font-mono">{formatNumber(bill.total)} ج.م</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                    <span className="text-gray-600">الخصم</span>
                    <span dir="ltr" className="font-mono">
                        {discount > 0 ? "- " : ""}
                        {formatNumber(discount)} ج.م
                    </span>
                </div>
                {returned > 0 && (
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                        <span className="text-gray-600">المرتجع</span>
                        <span dir="ltr" className="font-mono">
                            - {formatNumber(returned)} ج.م
                        </span>
                    </div>
                )}
                <div className="flex items-center justify-between px-4 py-3 text-[16px] font-extrabold" style={{ background: TINT_STRONG, color: NAVY }}>
                    <span className="text-[0.62em]">الإجمالي المستحق</span>
                    <span className="font-mono">
                        {formatNumber(net)}
                        <span className="text-[0.55em]"> ج.م</span>
                    </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                    <span className="text-gray-600">المدفوع</span>
                    <span className="font-mono">{formatNumber(paid)} ج.م</span>
                </div>
                <div
                    className="flex items-center justify-between px-4 py-3 font-extrabold"
                    style={settled ? { background: "#f0fdf4", color: "#15803d" } : { background: "#fef2f2", color: "#b91c1c" }}
                >
                    <span>المتبقي</span>
                    <span className="font-mono text-[1.15em]">{formatNumber(remaining)} ج.م</span>
                </div>
            </div>

            {/* Items */}
            <table className="w-full border-collapse overflow-hidden rounded-xl">
                <thead>
                    <tr style={{ background: TINT_STRONG, color: NAVY }}>
                        <th className="w-[7%] px-1 py-1.5 text-center text-[10.5px] font-extrabold">#</th>
                        <th className="px-1 py-1.5 text-right text-[10.5px] font-extrabold">الصنف</th>
                        <th className="w-[13%] px-1 py-1.5 text-center text-[10.5px] font-extrabold">الكمية</th>
                        <th className="w-[17%] px-1 py-1.5 text-center text-[10.5px] font-extrabold">السعر</th>
                        <th className="w-[19%] px-1 py-1.5 text-center text-[10.5px] font-extrabold">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.items.map((item, i) => (
                        <tr key={i} style={{ background: i % 2 === 1 ? "#f3f6fc" : "#ffffff" }}>
                            <td className="border-b border-gray-200 px-1 py-1.5 text-center font-mono text-[11.5px] text-gray-500">{i + 1}</td>
                            <td className="border-b border-gray-200 px-1 py-1.5 text-[11.5px]">{item.name}</td>
                            <td className="border-b border-gray-200 px-1 py-1.5 text-center font-mono text-[11.5px]">{item.count}</td>
                            <td className="border-b border-gray-200 px-1 py-1.5 text-center font-mono text-[11.5px]">{formatNumber(item.price)}</td>
                            <td className="border-b border-gray-200 px-1 py-1.5 text-center font-mono text-[11.5px] font-extrabold">
                                {formatNumber(item.price * item.count)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <footer className="mt-6 border-t-2 pt-3 text-center" style={{ borderColor: GOLD }}>
                <p className="text-[11px]" style={{ color: NAVY }}>
                    شكراً لتعاملكم معنا — الراية للتجارة والتوزيع
                </p>
                <span className="text-[8px]">الورديان - نهاية شارع الامير لؤلؤ - موقف المتراس</span>
            </footer>
        </div>
    );
}
