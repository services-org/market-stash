"use client";
import { isServer, QueryClient, QueryClientProvider } from "@tanstack/react-query";

type QueryProviderProps = {
    children: React.ReactNode;
};

let browserQueryClient: QueryClient | undefined;
const queryClient = () => new QueryClient({ defaultOptions: { queries: { staleTime: 1000 * 60 * 60 * 5 } } });

const getQueryClient = () => {
    if (isServer) return queryClient();
    browserQueryClient ??= queryClient();
    return browserQueryClient;
};

export const QueryProvider = ({ children }: QueryProviderProps) => {
    const client = getQueryClient();
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
