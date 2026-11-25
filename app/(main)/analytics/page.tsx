import { AlertTriangle, BarChart3, Coins, Crown, Moon, Scale, Trophy, Warehouse } from "lucide-react";

import { LocationCostsCard, TopProductsCard, ProfitsCard, TrendsCard, LowStockCard, DeadStockCard, TopCustomersCard, NetProfitCard } from "./_components";
import { AccordionSections } from "./_components/accordion-sections";
import { PageHeader } from "@/components/common";

const SECTIONS = [
    { id: "trends", title: "الاتجاه الشهري", icon: <BarChart3 className="size-5" />, content: <TrendsCard /> },
    { id: "profits", title: "إحصائيات الأرباح", icon: <Coins className="size-5" />, content: <ProfitsCard /> },
    { id: "net-profit", title: "صافي الربح بعد المصروفات", hint: "آخر 6 شهور", icon: <Scale className="size-5" />, content: <NetProfitCard /> },
    { id: "low-stock", title: "مخزون منخفض", icon: <AlertTriangle className="size-5" />, content: <LowStockCard /> },
    { id: "locations", title: "إحصائيات المخازن", icon: <Warehouse className="size-5" />, content: <LocationCostsCard /> },
    { id: "top-products", title: "الأكثر مبيعاً", hint: "آخر 30 يوم", icon: <Trophy className="size-5" />, content: <TopProductsCard /> },
    { id: "top-customers", title: "أفضل العملاء", icon: <Crown className="size-5" />, content: <TopCustomersCard /> },
    { id: "dead-stock", title: "منتجات راكدة", hint: "لم تُبع منذ 60 يوم", icon: <Moon className="size-5" />, content: <DeadStockCard /> },
];

const Analytics = () => {
    return (
        <div className="space-y-6 pb-20">
            <PageHeader title="الاحصائيات" subtitle="اضغط على أي قسم لفتحه" />

            <div className="px-4">
                <AccordionSections sections={SECTIONS} />
            </div>
        </div>
    );
};

Analytics.displayName = "Analytics";
export default Analytics;
