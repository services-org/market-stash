"use client";

import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

type UseDeleteOptions<TData> = Omit<UseMutationOptions<TData, Error, void>, "mutationFn"> & {
    invalidateKeys?: string[];
    /** When set, a toast with an "undo" button is shown after the delete (POSTs to `url`). */
    undo?: { url: string; message?: string };
};

function errorMessage(error: Error) {
    try {
        return JSON.parse(error.message).error || "حدث خطأ";
    } catch {
        return error.message || "حدث خطأ";
    }
}

export function useDelete<TData = unknown>(url: string, options?: UseDeleteOptions<TData>) {
    const queryClient = useQueryClient();
    const { invalidateKeys, undo, onSuccess, ...rest } = options ?? {};

    const invalidate = () => invalidateKeys?.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));

    return useMutation<TData, Error, void>({
        ...rest,
        mutationFn: async () => {
            const res = await fetch(url, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: (...args) => {
            invalidate();

            if (undo) {
                toast.success(undo.message ?? "تم الحذف", {
                    duration: 8000,
                    action: {
                        label: "تراجع",
                        onClick: async () => {
                            const res = await fetch(undo.url, { method: "POST" });
                            if (res.ok) {
                                toast.success("تم الاسترجاع");
                            } else {
                                toast.error(errorMessage(new Error(await res.text())));
                            }
                            invalidate();
                        },
                    },
                });
            }

            onSuccess?.(...args);
        },
        onError: (error) => toast.error(errorMessage(error)),
    });
}
