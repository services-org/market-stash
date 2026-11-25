"use client";
import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { ProductPicker } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TProduct } from "@/server/models/product";
import { formatNumber } from "@/lib/utils";
import { useGet } from "@/hooks/api";

type Line = { productId: string; name: string; count: string; buyPrice: string };

export type TPurchasePayload = {
    supplierName: string;
    phone?: string;
    notes?: string;
    paid?: number;
    items: { productId: string; name: string; count: number; buyPrice: number }[];
};

const EMPTY_LINE: Line = { productId: "", name: "", count: "1", buyPrice: "" };
const digits = (value: string) => value.replace(/[^\d.]/g, "");

/** A purchase from a supplier: which products came in, at what buy price, and how much was paid. */
export function PurchaseForm({ isPending, onSubmit }: Readonly<{ isPending: boolean; onSubmit: (payload: TPurchasePayload) => void }>) {
    const listId = useId();
    const { data: products = [] } = useGet<TProduct[]>("/api/products", { queryKey: ["products"] });
    const { data: suppliers = [] } = useGet<string[]>("/api/suppliers", { queryKey: ["suppliers"] });

    const [supplierName, setSupplierName] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [paid, setPaid] = useState("");
    const [lines, setLines] = useState<Line[]>([EMPTY_LINE]);

    const update = (index: number, patch: Partial<Line>) => setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));

    const total = lines.reduce((sum, l) => sum + (Number(l.count) || 0) * (Number(l.buyPrice) || 0), 0);
    const paidValue = paid ? Math.min(Number(paid) || 0, total) : total;
    const remaining = total - paidValue;

    const valid =
        supplierName.trim().length > 0 &&
        lines.length > 0 &&
        lines.every((l) => l.productId && Number(l.count) >= 1 && Number.isInteger(Number(l.count)) && l.buyPrice !== "" && Number(l.buyPrice) >= 0);

    return (
        <form
            className="space-y-4"
            onSubmit={(e) => {
                e.preventDefault();
                if (!valid) return;
                onSubmit({
                    supplierName: supplierName.trim(),
                    phone: phone.trim() || undefined,
                    notes: notes.trim() || undefined,
                    paid: paid ? Number(paid) : undefined,
                    items: lines.map((l) => ({ productId: l.productId, name: l.name, count: Number(l.count), buyPrice: Number(l.buyPrice) })),
                });
            }}
        >
            <div className="space-y-2">
                <Label htmlFor="supplier-name">اسم المورد</Label>
                <Input id="supplier-name" list={listId} placeholder="اسم المورد" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
                <datalist id={listId}>
                    {suppliers.map((name) => (
                        <option key={name} value={name} />
                    ))}
                </datalist>
            </div>
            <div className="space-y-2">
                <Label htmlFor="supplier-phone">رقم الهاتف</Label>
                <Input id="supplier-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="space-y-3">
                <Label>المنتجات</Label>
                {lines.map((line, index) => (
                    <div key={index} className="space-y-2 rounded-xl border border-border/60 p-3">
                        <div className="flex items-start gap-2">
                            <ProductPicker
                                products={products}
                                value={line.productId}
                                allowOutOfStock
                                onSelect={(p) => update(index, { productId: p._id, name: `${p.company} - ${p.name}`, buyPrice: String(p.buyPrice) })}
                            />
                            {lines.length > 1 && (
                                <button
                                    type="button"
                                    aria-label="حذف المنتج"
                                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                                    className="flex size-9 shrink-0 items-center justify-center rounded-md text-destructive hover:bg-accent"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">الكمية</Label>
                                <Input inputMode="numeric" value={line.count} onChange={(e) => update(index, { count: digits(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">سعر الشراء</Label>
                                <Input inputMode="decimal" placeholder="0" value={line.buyPrice} onChange={(e) => update(index, { buyPrice: digits(e.target.value) })} />
                            </div>
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => setLines((prev) => [...prev, EMPTY_LINE])}>
                    <Plus className="size-3" /> إضافة منتج
                </Button>
            </div>

            <div className="space-y-2">
                <Label htmlFor="purchase-paid">المدفوع للمورد (ج.م)</Label>
                <Input id="purchase-paid" inputMode="decimal" placeholder="كامل المبلغ" value={paid} onChange={(e) => setPaid(digits(e.target.value))} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="purchase-notes">ملاحظات</Label>
                <Input id="purchase-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="space-y-1.5 rounded-xl bg-muted/50 p-3 text-sm">
                <div className="flex items-center justify-between font-semibold">
                    <span>الإجمالي</span>
                    <span className="font-mono">{formatNumber(total)} ج.م</span>
                </div>
                {remaining > 0 && (
                    <div className="flex items-center justify-between font-semibold text-destructive">
                        <span>المتبقي للمورد</span>
                        <span className="font-mono">{formatNumber(remaining)} ج.م</span>
                    </div>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={!valid || isPending}>
                {isPending ? "جاري الحفظ..." : "حفظ فاتورة الشراء"}
            </Button>
        </form>
    );
}
