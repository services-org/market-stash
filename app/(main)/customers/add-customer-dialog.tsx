"use client";
import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreate } from "@/hooks/api";
import { Dialog } from "@/ui/dialog";

/** Saves a customer (name, phone, address) without making a bill, so he can be picked in the next one. */
export function AddCustomerDialog() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");

    const { mutate, isPending } = useCreate("/api/customers", {
        invalidateKeys: ["customers"],
        onSuccess: () => {
            setOpen(false);
            setName("");
            setPhone("");
            setAddress("");
        },
    });

    const valid = name.trim().length > 0;

    return (
        <Dialog
            trigger={
                <Button size="icon" aria-label="إضافة عميل" className="size-9 rounded-full shadow-md">
                    <Plus className="size-4" />
                </Button>
            }
            title="عميل جديد"
            open={open}
            onOpenChange={setOpen}
        >
            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (valid) mutate({ name: name.trim(), phone: phone.trim() || undefined, address: address.trim() || undefined });
                }}
            >
                <div className="space-y-2">
                    <Label htmlFor="new-customer-name">اسم العميل</Label>
                    <Input id="new-customer-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-customer-phone">رقم الهاتف</Label>
                    <Input id="new-customer-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-customer-address">العنوان</Label>
                    <Input id="new-customer-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={!valid || isPending}>
                    {isPending ? "جاري الحفظ..." : "حفظ العميل"}
                </Button>
            </form>
        </Dialog>
    );
}
