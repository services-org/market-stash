"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

type UseGetOptions<T> = Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> & {
    queryKey: string[];
    enabled?: boolean;
};

export function useGet<T = unknown>(url: string, options: UseGetOptions<T>) {
    return useQuery<T>({
        ...options,
        queryFn: async () => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
    });
}
