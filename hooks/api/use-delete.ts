"use client";

import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

type UseDeleteOptions<TData> = Omit<UseMutationOptions<TData, Error, void>, "mutationFn"> & {
    invalidateKeys?: string[];
};

export function useDelete<TData = unknown>(url: string, options?: UseDeleteOptions<TData>) {
    const queryClient = useQueryClient();
    const { invalidateKeys, onSuccess, ...rest } = options ?? {};

    return useMutation<TData, Error, void>({
        ...rest,
        mutationFn: async () => {
            const res = await fetch(url, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: (...args) => {
            invalidateKeys?.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
            onSuccess?.(...args);
        },
        onError: (error) => {
            try {
                const parsed = JSON.parse(error.message);
                toast.error(parsed.error || "حدث خطأ");
            } catch {
                toast.error(error.message || "حدث خطأ");
            }
        },
    });
}
