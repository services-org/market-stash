import { useFormContext } from "react-hook-form";

import { Input as ShadInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TInput = {
    type?: "string" | "number";
    placeholder?: string;
    label?: string;
    name: string;
    inputProps?: Record<string, unknown>;
};

export const Input = ({ type, name, label, placeholder, inputProps }: TInput) => {
    const form = useFormContext();

    return (
        <div className="space-y-2">
            {label && <Label htmlFor={name}>{label}</Label>}

            <ShadInput
                {...form.register(name, { valueAsNumber: type === "number" })}
                {...inputProps}
                placeholder={placeholder ?? label}
                type={type}
                id={name}
            />

            {form.formState.errors[name]?.message && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors[name]?.message as string}</p>
            )}
        </div>
    );
};

Input.displayName = "Input";
