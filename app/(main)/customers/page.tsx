import { CustomersClient } from "./customers-client";

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function CustomersPage({ searchParams }: Readonly<Props>) {
    const { tab } = await searchParams;

    // Keyed by the tab so the drawer link "المديونيات" resets the filter even when already on this page
    return <CustomersClient key={tab ?? "all"} initialDebt={tab === "debt"} />;
}
