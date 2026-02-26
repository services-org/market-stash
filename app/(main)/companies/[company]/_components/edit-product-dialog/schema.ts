import { z } from "zod";

export const editProductSchema = z.object({
    buyPrice: z.number().min(0, "سعر الشراء يجب أن يكون 0 أو أكثر"),
    sellPrice: z.number().min(0, "سعر البيع يجب أن يكون 0 أو أكثر"),
    count: z.number().int(),
});

export type TEditProductForm = z.infer<typeof editProductSchema>;
