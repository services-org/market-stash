"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Plus, PenLine, List } from "lucide-react";
import { useState } from "react";

import { addProductSchema, TAddProductForm } from "./schema";
import { Dialog, SelectBox } from "@/components/common";
import { useCreate, useGet } from "@/hooks/api";
import { LOCATIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TCompany = { _id: string; productCount: number; totalValue: number };

export function AddProductDialog() {
    const [isNewCompany, setIsNewCompany] = useState(false);
    const [open, setOpen] = useState(false);

    const { data: companies = [] } = useGet<TCompany[]>("/api/companies", {
        queryKey: ["companies"],
    });

    const { register, handleSubmit, reset, setValue, control, formState } = useForm<TAddProductForm>({
        resolver: zodResolver(addProductSchema),
        defaultValues: { name: "", company: "", buyPrice: 0, sellPrice: 0, count: 0, location: "" },
    });

    const company = useWatch({ control, name: "company" });
    const location = useWatch({ control, name: "location" });

    const { mutate, isPending } = useCreate("/api/products", {
        invalidateKeys: ["products", "locations", "companies"],
        onSuccess: () => {
            setOpen(false);
            setIsNewCompany(false);
            reset();
        },
    });

    function onSubmit(data: TAddProductForm) {
        mutate(data);
    }

    console.log(formState.errors);

    return (
        <Dialog
            onOpenChange={setOpen}
            title="إضافة منتج"
            open={open}
            trigger={
                <Button size="icon" className="size-9 rounded-full shadow-md">
                    <Plus className="size-4" />
                </Button>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>الشركة</Label>
                        <Button
                            className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                            variant="ghost"
                            type="button"
                            size="sm"
                            onClick={() => {
                                setIsNewCompany(!isNewCompany);
                                setValue("company", "");
                            }}
                        >
                            {isNewCompany ? (
                                <>
                                    <List className="size-3" /> اختر من القائمة
                                </>
                            ) : (
                                <>
                                    <PenLine className="size-3" /> شركة جديدة
                                </>
                            )}
                        </Button>
                    </div>
                    {isNewCompany ? (
                        <Input placeholder="اسم الشركة الجديدة" {...register("company")} />
                    ) : (
                        <SelectBox
                            value={company}
                            onValueChange={(v) => setValue("company", v)}
                            placeholder="اختر الشركة"
                            items={companies.map((c) => ({ value: c._id, label: c._id }))}
                        />
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">اسم المنتج</Label>
                    <Input id="name" placeholder="مثال: مقاس 1" {...register("name")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="buyPrice">سعر الشراء (ج.م)</Label>
                        <Input
                            id="buyPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...register("buyPrice", { valueAsNumber: true })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sellPrice">سعر البيع (ج.م)</Label>
                        <Input
                            id="sellPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...register("sellPrice", { valueAsNumber: true })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="count">الكمية</Label>
                    <Input id="count" type="number" min="0" placeholder="0" {...register("count", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                    <Label>الموقع</Label>
                    <SelectBox
                        value={location}
                        onValueChange={(v) => setValue("location", v)}
                        placeholder="اختر الموقع"
                        items={LOCATIONS.map((loc) => ({ value: loc, label: loc }))}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "جاري الإضافة..." : "إضافة المنتج"}
                </Button>
            </form>
        </Dialog>
    );
}
