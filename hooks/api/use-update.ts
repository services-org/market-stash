"use client";

import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

type UseUpdateOptions<TData, TVariables> = Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn"> & {
    invalidateKeys?: string[];
};

export function useUpdate<TData = unknown, TVariables = unknown>(url: string, options?: UseUpdateOptions<TData, TVariables>) {
    const queryClient = useQueryClient();
    const { invalidateKeys, onSuccess, ...rest } = options ?? {};

    return useMutation<TData, Error, TVariables>({
        ...rest,
        mutationFn: async (variables) => {
            const res = await fetch(url, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(variables),
            });
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
