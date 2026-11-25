// Pure helpers for bill amounts (safe to import from client components).
type Returns = { count: number; price: number }[];
type Amounts = { total: number; discount?: number; paid?: number; returns?: Returns };

/** Value of the goods the customer gave back. */
export const billReturned = (bill: Pick<Amounts, "returns">) => (bill.returns ?? []).reduce((sum, r) => sum + r.count * r.price, 0);

/** Net amount the customer owes for a bill (after discount and returns). */
export const billNet = (bill: Pick<Amounts, "total" | "discount" | "returns">) => Math.max(0, bill.total - (bill.discount ?? 0) - billReturned(bill));

/** Amount paid so far (legacy bills without `paid` are fully paid). Never more than the net amount. */
export const billPaid = (bill: Amounts) => Math.min(bill.paid ?? billNet(bill), billNet(bill));

/** Remaining balance of a bill. */
export const billRemaining = (bill: Amounts) => Math.max(0, billNet(bill) - billPaid(bill));

type Line = { productId?: string; name: string; price: number; count: number };
const lineKey = (line: Pick<Line, "productId" | "name" | "price">) => `${line.productId ?? ""}|${line.name}|${line.price}`;

/** How many of each item (by index) can still be returned: sold minus already returned, per product line. */
export function returnableCounts(bill: { items: Line[]; returns?: Line[] }) {
    const back = new Map<string, number>();
    for (const r of bill.returns ?? []) back.set(lineKey(r), (back.get(lineKey(r)) ?? 0) + r.count);

    return bill.items.map((item) => {
        const key = lineKey(item);
        const used = Math.min(item.count, back.get(key) ?? 0);
        back.set(key, (back.get(key) ?? 0) - used);
        return item.count - used;
    });
}
