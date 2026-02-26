import { useFormContext } from "react-hook-form";

import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SelectItemProps = {
    disabled?: boolean;
    value: string;
    label: string;
};

type TSelect = {
    onValueChange?: (value: string) => void;
    items: SelectItemProps[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    value?: string;
    label?: string;
    name: string;
};

export const Select = ({ name, label, value, placeholder, items, disabled, className, onValueChange }: TSelect) => {
    const form = useFormContext();

    return (
        <div className="space-y-2 w-full">
            {label && <Label>{label}</Label>}

            <ShadSelect disabled={disabled} value={value} onValueChange={(val) => onValueChange?.(val) ?? form.setValue(name, val)}>
                <SelectTrigger className={cn("w-full", className)}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {items.map((item) => (
                        <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </ShadSelect>

            {form.formState.errors[name]?.message && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors[name]?.message as string}</p>
            )}
        </div>
    );
};
