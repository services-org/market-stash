import { Trash2, Database, PenLine } from "lucide-react";
import { UseFormSetValue } from "react-hook-form";

import { TProduct } from "@/server/models/product";
import { Button } from "@/components/ui/button";
import { LOCATIONS } from "@/lib/constants";
import { TBillForm, TBillItem } from "./schema";
import { Select } from "@/ui/select";
import { Input } from "@/ui/input";

type BillItemFormProps = {
    index: number;
    item: TBillItem;
    canRemove: boolean;
    setValue: UseFormSetValue<TBillForm>;
    onRemove: () => void;
    onProductSelect: (index: number, productId: string) => void;
    getFilteredProducts: (location: string) => TProduct[];
};

export function BillItemForm({ index, item, canRemove, setValue, onRemove, onProductSelect, getFilteredProducts }: BillItemFormProps) {
    return (
        <div className="space-y-2 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                    onClick={() => {
                        setValue(`items.${index}.isFromDB`, !item.isFromDB);
                        setValue(`items.${index}.productId`, "");
                        setValue(`items.${index}.name`, "");
                        setValue(`items.${index}.price`, 0);
                        setValue(`items.${index}.location`, "");
                    }}
                >
                    {item.isFromDB ? (
                        <>
                            <Database className="size-3" /> من المخازن
                        </>
                    ) : (
                        <>
                            <PenLine className="size-3" /> منتج خارجي
                        </>
                    )}
                </Button>
                {canRemove && (
                    <Button type="button" variant="ghost" size="icon" className="size-6 text-destructive" onClick={onRemove}>
                        <Trash2 className="size-3" />
                    </Button>
                )}
            </div>

            {item.isFromDB ? (
                <div className="flex items-center justify-between gap-3">
                    <Select
                        name={`items.${index}.location`}
                        items={LOCATIONS.map((loc) => ({ value: loc, label: loc }))}
                        placeholder="اختر الموقع"
                        value={item.location}
                        onValueChange={(v) => {
                            setValue(`items.${index}.productId`, "");
                            setValue(`items.${index}.location`, v);
                            setValue(`items.${index}.name`, "");
                            setValue(`items.${index}.price`, 0);
                        }}
                    />
                    <Select
                        onValueChange={(v) => onProductSelect(index, v)}
                        name={`items.${index}.productId`}
                        placeholder="اختر المنتج"
                        disabled={!item.location}
                        value={item.productId}
                        items={getFilteredProducts(item.location).map((p) => ({
                            value: p._id,
                            label: `${p.company} - ${p.name} (متاح: ${p.count})`,
                            disabled: p.count <= 0,
                        }))}
                    />
                </div>
            ) : (
                <Input name={`items.${index}.name`} placeholder="اسم المنتج" />
            )}

            <div className="grid grid-cols-2 gap-2">
                <Input type="number" name={`items.${index}.count`} label="الكمية" inputProps={{ min: "1" }} />
                <Input type="number" name={`items.${index}.price`} label="السعر (ج.م)" inputProps={{ min: "0" }} />
            </div>
        </div>
    );
}
