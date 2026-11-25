export const LOCATIONS = ["المحل", "مخزن 1", "مخزن 2"];

/**
 * Profit margin assumed (as a share of the selling price) for bill items whose buy price is unknown,
 * e.g. items typed straight into a bill instead of being picked from the stock.
 */
export const DEFAULT_PROFIT_RATE = 0.05;

/** The shop is in Egypt: days and months are cut at local midnight, not at UTC midnight. */
export const SHOP_TIMEZONE = "Africa/Cairo";
