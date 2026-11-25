"use client";
import { useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { UserCheck, UserPlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { matchesSearch } from "@/lib/utils";

export type TCustomerOption = { _id: string; phone?: string; address?: string; billsCount?: number };

/**
 * Customer name with a list of saved customers. Picking one fills his phone and address; typing a new
 * name is fine too: the customer is saved together with the bill and can be picked next time.
 */
export function CustomerField({ customers }: Readonly<{ customers: TCustomerOption[] }>) {
    const { control, setValue, formState } = useFormContext();
    const [open, setOpen] = useState(false);

    return (
        <Controller
            name="customerName"
            control={control}
            render={({ field }) => <CustomerInput {...{ field, customers, open, setOpen, setValue, error: formState.errors.customerName?.message as string | undefined }} />}
        />
    );
}

type InputProps = {
    field: { value: string; onChange: (value: string) => void; onBlur: () => void };
    customers: TCustomerOption[];
    open: boolean;
    setOpen: (open: boolean) => void;
    setValue: (name: string, value: string) => void;
    error?: string;
};

function CustomerInput({ field, customers, open, setOpen, setValue, error }: Readonly<InputProps>) {
    const value = field.value ?? "";
    const exact = customers.find((c) => c._id === value.trim());

    const matches = useMemo(() => (value.trim() ? customers.filter((c) => matchesSearch(value, c._id, c.phone)) : customers).slice(0, 8), [customers, value]);

    function pick(customer: TCustomerOption) {
        field.onChange(customer._id);
        // Replace the previous customer's data (empty when nothing is saved)
        setValue("phone", customer.phone ?? "");
        setValue("address", customer.address ?? "");
        setOpen(false);
    }

    return (
        <div className="relative space-y-2">
            <Label htmlFor="customerName">اسم العميل</Label>
            <Input
                id="customerName"
                autoComplete="off"
                placeholder="اكتب اسم العميل أو اختر من المحفوظين"
                value={value}
                onChange={(e) => {
                    field.onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                    field.onBlur();
                    // let a tap on the list register before it closes
                    window.setTimeout(() => setOpen(false), 150);
                }}
            />

            {open && matches.length > 0 && !exact && (
                <ul className="absolute inset-x-0 z-20 max-h-56 overflow-y-auto rounded-xl border border-border/60 bg-popover p-1 shadow-lg" role="listbox">
                    {matches.map((c) => (
                        <li key={c._id} role="option" aria-selected={false}>
                            <button
                                type="button"
                                onPointerDown={(e) => {
                                    e.preventDefault();
                                    pick(c);
                                }}
                                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-accent"
                            >
                                <span className="min-w-0 truncate font-semibold">{c._id}</span>
                                {c.phone && (
                                    <span dir="ltr" className="shrink-0 font-mono text-xs text-muted-foreground">
                                        {c.phone}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {value.trim() &&
                (exact ? (
                    <p className="flex items-center gap-1.5 text-xs text-emerald-500">
                        <UserCheck className="size-3.5" /> عميل محفوظ
                    </p>
                ) : (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserPlus className="size-3.5" /> عميل جديد: سيُحفظ مع الفاتورة
                    </p>
                ))}

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>
    );
}
