import type { TProduct } from "@/server/models/product";

/**
 * Low-stock tracking is opt-in: a product is "low" only when it has a `minStock` alert level
 * and its quantity has reached it (many catalog items legitimately sit at 0).
 */
export const isLowStock = (product: Pick<TProduct, "count" | "minStock">) =>
    product.minStock !== undefined && product.minStock !== null && product.count <= product.minStock;

/** Parses the optional "alert level" text field: empty means not tracked. */
export const parseMinStock = (value?: string) => (value?.trim() ? Number(value) : undefined);
