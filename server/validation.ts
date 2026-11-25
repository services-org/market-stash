import { z } from "zod";

import { LOCATIONS } from "@/lib/constants";

/** Optional text: trims and turns empty strings into `undefined`. */
const optionalText = z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined));

const money = z.number({ error: "قيمة غير صالحة" }).finite().min(0, "القيمة لا يمكن أن تكون سالبة");

export const billItemInput = z.object({
    productId: optionalText,
    name: z.string().trim().min(1, "اسم المنتج مطلوب"),
    count: z.number().int("الكمية يجب أن تكون رقماً صحيحاً").min(1, "الكمية يجب أن تكون 1 على الأقل"),
    price: money,
    location: optionalText,
});

export const billInput = z.object({
    customerName: z.string().trim().min(1, "اسم العميل مطلوب"),
    phone: optionalText,
    address: optionalText,
    deliveryDate: optionalText,
    representative: optionalText,
    notes: optionalText,
    discount: money.optional(),
    paid: money.optional(),
    items: z.array(billItemInput).min(1, "يجب إضافة منتج واحد على الأقل"),
});

export type TBillInput = z.infer<typeof billInput>;

export const productCreateInput = z.object({
    name: z.string().trim().min(1, "اسم المنتج مطلوب"),
    company: z.string().trim().min(1, "الشركة مطلوبة"),
    buyPrice: money,
    sellPrice: money,
    count: z.number().int().min(0, "الكمية يجب أن تكون 0 أو أكثر"),
    location: z.string().trim().refine((v) => LOCATIONS.includes(v), "الموقع غير صالح"),
    barcode: optionalText,
    minStock: z.number().int().min(0).optional(),
});

export type TProductCreateInput = z.infer<typeof productCreateInput>;

export const productUpdateInput = z.object({
    name: z.string().trim().min(1, "اسم المنتج مطلوب").optional(),
    buyPrice: money.optional(),
    sellPrice: money.optional(),
    /** Quantity delta (positive adds, negative subtracts). */
    count: z.number().int().optional(),
    barcode: optionalText,
    /** null removes the alert level. */
    minStock: z.number().int().min(0).nullable().optional(),
});

export type TProductUpdateInput = z.infer<typeof productUpdateInput>;

export const transferInput = z.object({
    toLocation: z.string().trim().refine((v) => LOCATIONS.includes(v), "الموقع غير صالح"),
    count: z.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
    sellPrice: money.optional(),
});

export const customerInput = z.object({
    name: z.string().trim().min(1, "اسم العميل مطلوب"),
    phone: optionalText,
    address: optionalText,
});

export const returnInput = z.object({
    items: z
        .array(
            z.object({
                index: z.number().int().min(0),
                count: z.number().int("الكمية يجب أن تكون رقماً صحيحاً").min(1, "الكمية يجب أن تكون 1 على الأقل"),
            }),
        )
        .min(1, "اختر صنفاً واحداً على الأقل"),
});

export const purchaseInput = z.object({
    supplierName: z.string().trim().min(1, "اسم المورد مطلوب"),
    phone: optionalText,
    notes: optionalText,
    paid: money.optional(),
    items: z
        .array(
            z.object({
                productId: z.string().trim().min(1, "اختر المنتج"),
                name: z.string().trim().min(1, "اسم المنتج مطلوب"),
                count: z.number().int("الكمية يجب أن تكون رقماً صحيحاً").min(1, "الكمية يجب أن تكون 1 على الأقل"),
                buyPrice: money,
            }),
        )
        .min(1, "يجب إضافة منتج واحد على الأقل"),
});

export type TPurchaseInput = z.infer<typeof purchaseInput>;

export const expenseInput = z.object({
    title: z.string().trim().min(1, "وصف المصروف مطلوب"),
    category: optionalText,
    amount: z.number({ error: "قيمة غير صالحة" }).finite().gt(0, "المبلغ يجب أن يكون أكبر من 0"),
    /** ISO date (defaults to now). */
    date: optionalText,
});

export const stocktakeInput = z.object({
    items: z.array(z.object({ id: z.string().min(1), count: z.number().int().min(0, "الكمية يجب أن تكون 0 أو أكثر") })).min(1, "لا توجد تغييرات"),
});

export const paymentInput = z.object({
    amount: z.number().finite().gt(0, "المبلغ يجب أن يكون أكبر من 0"),
});

/** Turns a zod error into a single Arabic-friendly message. */
export function formatZodError(error: z.ZodError) {
    return error.issues[0]?.message ?? "بيانات غير صالحة";
}
