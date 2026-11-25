import { z } from "zod";

export const editProductSchema = z.object({
    buyPrice: z.number().min(0, "سعر الشراء يجب أن يكون 0 أو أكثر"),
    sellPrice: z.number().min(0, "سعر البيع يجب أن يكون 0 أو أكثر"),
    count: z.number().int(),
    minStock: z
        .string()
        .optional()
        .refine((v) => !v?.trim() || (Number.isInteger(Number(v)) && Number(v) >= 0), "أدخل رقماً صحيحاً (0 أو أكثر)"),
    barcode: z.string().optional(),
});

export type TEditProductForm = z.infer<typeof editProductSchema>;
