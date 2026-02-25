import { z } from "zod";

export const addProductSchema = z.object({
    name: z.string().min(1, "اسم المنتج مطلوب"),
    company: z.string().min(1, "الشركة مطلوبة"),
    buyPrice: z.number().min(0, "سعر الشراء يجب أن يكون 0 أو أكثر"),
    sellPrice: z.number().min(0, "سعر البيع يجب أن يكون 0 أو أكثر"),
    count: z.number().int().min(0, "الكمية يجب أن تكون 0 أو أكثر"),
    location: z.string().min(1, "الموقع مطلوب"),
});

export type TAddProductForm = z.infer<typeof addProductSchema>;
