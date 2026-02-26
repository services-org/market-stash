import { z } from "zod";

export const transferProductSchema = z.object({
    toLocation: z.string().min(1, "Location is required"),
    count: z.number().min(1, "Count must be at least 1"),
    sellPrice: z.number().min(0, "Invalid price"),
});

export type TTransferProductForm = z.infer<typeof transferProductSchema>;
