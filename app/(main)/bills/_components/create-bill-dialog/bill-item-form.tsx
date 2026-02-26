import { Trash2, Database, PenLine } from "lucide-react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";

import { SelectBox } from "@/components/common";
import { TProduct } from "@/server/models/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOCATIONS } from "@/lib/constants";
import { TBillForm, TBillItem } from "./schema";

type BillItemFormProps = {
    index: number;
    item: TBillItem;
    canRemove: boolean;
    register: UseFormRegister<TBillForm>;
    setValue: UseFormSetValue<TBillForm>;
    onRemove: () => void;
    onProductSelect: (index: number, productId: string) => void;
    getFilteredProducts: (location: string) => TProduct[];
};

export function BillItemForm({ index, item, canRemove, register, setValue, onRemove, onProductSelect, getFilteredProducts }: BillItemFormProps) {
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
                    <SelectBox
                        value={item.location}
                        onValueChange={(v) => {
                            setValue(`items.${index}.location`, v);
                            setValue(`items.${index}.productId`, "");
                            setValue(`items.${index}.name`, "");
                            setValue(`items.${index}.price`, 0);
                        }}
                        placeholder="اختر الموقع"
                        items={LOCATIONS.map((loc) => ({ value: loc, label: loc }))}
                        className="w-full"
                    />
                    <SelectBox
                        value={item.productId}
                        onValueChange={(v) => onProductSelect(index, v)}
                        disabled={!item.location}
                        placeholder="اختر المنتج"
                        items={getFilteredProducts(item.location).map((p) => ({
                            value: p._id,
                            label: `${p.company} - ${p.name} (متاح: ${p.count})`,
                            disabled: p.count <= 0,
                        }))}
                        className="w-full"
                    />
                </div>
            ) : (
                <Input placeholder="اسم المنتج" {...register(`items.${index}.name`)} />
            )}

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label className="text-xs">الكمية</Label>
                    <Input type="number" min="1" {...register(`items.${index}.count`, { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">السعر (ج.م)</Label>
                    <Input type="number" min="0" step="0.01" {...register(`items.${index}.price`, { valueAsNumber: true })} />
                </div>
            </div>
        </div>
    );
}
