import { connectDB } from "@/server/config/database";
import { Bill } from "@/server/models/bill";
import { billNet, billPaid } from "@/lib/bill";
import { Product } from "@/server/models/product";
import { getUserId } from "@/server/actions/product";

type Cell = string | number | null | undefined;

/** Builds a CSV (with a UTF-8 BOM so Excel opens Arabic correctly). */
function toCsv(headers: string[], rows: Cell[][]) {
    const escape = (cell: Cell) => {
        const text = cell === null || cell === undefined ? "" : String(cell);
        // Guard against spreadsheet formula injection
        const safe = /^[=+\-@]/.test(text) && Number.isNaN(Number(text)) ? `'${text}` : text;
        return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    return "\uFEFF" + [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
}

const formatDate = (date: Date) => new Date(date).toISOString().slice(0, 10);

export async function exportProductsCsv() {
    await connectDB();
    const userId = await getUserId();

    const products = await Product.find({ userId, deletedAt: null }).sort({ company: 1, name: 1 }).lean();

    return toCsv(
        ["الشركة", "المنتج", "الموقع", "الكمية", "سعر الشراء", "سعر البيع", "قيمة الشراء", "قيمة البيع", "الباركود", "الحد الأدنى"],
        products.map((p) => [p.company, p.name, p.location, p.count, p.buyPrice, p.sellPrice, p.count * p.buyPrice, p.count * p.sellPrice, p.barcode, p.minStock]),
    );
}

export async function exportBillsCsv() {
    await connectDB();
    const userId = await getUserId();

    const bills = await Bill.find({ userId, deletedAt: null }).sort({ createdAt: -1 }).lean();

    const rows: Cell[][] = [];
    for (const bill of bills) {
        for (const item of bill.items) {
            rows.push([
                bill.number,
                formatDate(bill.createdAt),
                bill.customerName,
                bill.phone,
                bill.address,
                bill.representative,
                bill.deliveryDate,
                item.name,
                item.count,
                item.price,
                item.count * item.price,
                bill.total,
                bill.discount ?? 0,
                billNet(bill),
                billPaid(bill),
                billNet(bill) - billPaid(bill),
                bill.notes,
            ]);
        }
    }

    return toCsv(
        ["رقم الفاتورة", "التاريخ", "العميل", "الهاتف", "العنوان", "المندوب", "تاريخ التسليم", "المنتج", "الكمية", "السعر", "مجموع الصنف", "إجمالي الفاتورة", "الخصم", "الصافي", "المدفوع", "المتبقي", "ملاحظات"],
        rows,
    );
}
