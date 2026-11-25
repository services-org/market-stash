import { z } from "zod";

export const billItemSchema = z.object({
    isFromDB: z.boolean(),
    productId: z.string(),
    name: z.string().min(1, "اسم المنتج مطلوب"),
    count: z.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
    price: z.number().min(0, "السعر يجب أن يكون 0 أو أكثر"),
    location: z.string(),
});

const amount = z
    .string()
    .optional()
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), "قيمة غير صالحة");

export const billSchema = z.object({
    customerName: z.string().min(1, "اسم العميل مطلوب"),
    phone: z.string().optional(),
    address: z.string().optional(),
    deliveryDate: z.string().optional(),
    representative: z.string().optional(),
    notes: z.string().optional(),
    discount: amount,
    paid: amount,
    items: z.array(billItemSchema).min(1, "يجب إضافة منتج واحد على الأقل"),
});

export type TBillForm = z.infer<typeof billSchema>;
export type TBillItem = z.infer<typeof billItemSchema>;
