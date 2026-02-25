import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SelectItem = {
    value: string;
    label: string;
    disabled?: boolean;
};

type SelectBoxProps = {
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    items: SelectItem[];
    disabled?: boolean;
    className?: string;
};

export function SelectBox({ value, onValueChange, placeholder, items, disabled, className }: SelectBoxProps) {
    return (
        <ShadSelect value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className={className}>
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
    );
}
