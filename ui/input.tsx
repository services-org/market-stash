import { useFormContext } from "react-hook-form";

import { Input as ShadInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TInput = {
    type?: "string" | "number" | "date" | "tel";
    placeholder?: string;
    label?: string;
    name: string;
    /** Suggestions shown while typing (native datalist). The field stays free text. */
    suggestions?: string[];
    inputProps?: Record<string, unknown>;
};

export const Input = ({ type, name, label, placeholder, suggestions, inputProps }: TInput) => {
    const form = useFormContext();
    const listId = suggestions?.length ? `${name}-suggestions` : undefined;

    return (
        <div className="space-y-2">
            {label && <Label htmlFor={name}>{label}</Label>}

            <ShadInput
                {...form.register(name, { valueAsNumber: type === "number" })}
                {...inputProps}
                placeholder={placeholder ?? label}
                type={type}
                id={name}
                list={listId}
                autoComplete={listId ? "off" : undefined}
            />

            {listId && (
                <datalist id={listId}>
                    {suggestions?.map((s) => (
                        <option key={s} value={s} />
                    ))}
                </datalist>
            )}

            {form.formState.errors[name]?.message && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors[name]?.message as string}</p>
            )}
        </div>
    );
};

Input.displayName = "Input";
