import { PageHeader } from "@/components/common";
import { LocationCostsCard, TopProductsCard } from "./_components";

const Analytics = () => {
    return (
        <div className="space-y-6 pb-20">
            <PageHeader title="الاحصائيات" subtitle="نظرة عامة على المخزون والمبيعات" />

            <div className="px-4 space-y-8">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">إحصائيات المخازن</h2>
                    <LocationCostsCard />
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        الأكثر مبيعاً <span className="text-sm font-normal text-muted-foreground">(آخر 30 يوم)</span>
                    </h2>
                    <TopProductsCard />
                </section>
            </div>
        </div>
    );
};

Analytics.displayName = "Analytics";
export default Analytics;
