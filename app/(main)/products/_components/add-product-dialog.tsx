"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, PenLine, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreate, useGet } from "@/hooks/api";

const LOCATIONS = ["المحل", "مخزن 1", "مخزن 2"];

const addProductSchema = z.object({
    name: z.string().min(1, "اسم المنتج مطلوب"),
    company: z.string().min(1, "الشركة مطلوبة"),
    buyPrice: z.number().min(0, "سعر الشراء يجب أن يكون 0 أو أكثر"),
    sellPrice: z.number().min(0, "سعر البيع يجب أن يكون 0 أو أكثر"),
    count: z.number().int().min(0, "الكمية يجب أن تكون 0 أو أكثر"),
    location: z.string().min(1, "الموقع مطلوب"),
});

type TAddProductForm = z.infer<typeof addProductSchema>;
type TCompany = { _id: string; productCount: number; totalValue: number };

export function AddProductDialog() {
    const [open, setOpen] = useState(false);
    const [isNewCompany, setIsNewCompany] = useState(false);

    const { data: companies = [] } = useGet<TCompany[]>("/api/companies", {
        queryKey: ["companies"],
    });

    const { register, handleSubmit, reset, setValue, control } = useForm<TAddProductForm>({
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" className="size-9 rounded-full shadow-md">
                    <Plus className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)]">
                <DialogHeader>
                    <DialogTitle>إضافة منتج</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>الشركة</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 gap-1 px-2 text-xs text-muted-foreground"
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
                            <Select value={company} onValueChange={(v) => setValue("company", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الشركة" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c._id} value={c._id}>
                                            {c._id}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">اسم المنتج</Label>
                        <Input id="name" placeholder="مثال: مقاس 1" {...register("name")} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="buyPrice">سعر الشراء (ج.م)</Label>
                            <Input id="buyPrice" type="number" min="0" step="0.01" placeholder="0.00" {...register("buyPrice")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sellPrice">سعر البيع (ج.م)</Label>
                            <Input id="sellPrice" type="number" min="0" step="0.01" placeholder="0.00" {...register("sellPrice")} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="count">الكمية</Label>
                        <Input id="count" type="number" min="0" placeholder="0" {...register("count")} />
                    </div>
                    <div className="space-y-2">
                        <Label>الموقع</Label>
                        <Select value={location} onValueChange={(v) => setValue("location", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الموقع" />
                            </SelectTrigger>
                            <SelectContent>
                                {LOCATIONS.map((loc) => (
                                    <SelectItem key={loc} value={loc}>
                                        {loc}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "جاري الإضافة..." : "إضافة المنتج"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
