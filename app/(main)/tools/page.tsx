import { Download, FileSpreadsheet } from "lucide-react";

import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";

const EXPORTS = [
    { type: "products", title: "المنتجات", hint: "كل المنتجات بالكميات والأسعار وقيمة المخزون" },
    { type: "bills", title: "الفواتير", hint: "كل الفواتير بتفاصيل الأصناف والمدفوع والمتبقي" },
];

export default function ToolsPage() {
    return (
        <>
            <PageHeader title="تصدير البيانات" subtitle="ملفات تفتح في Excel" />

            <div className="space-y-3 p-4">
                {EXPORTS.map(({ type, title, hint }) => (
                    <div key={type} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <FileSpreadsheet className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-bold">{title}</h2>
                            <p className="text-xs text-muted-foreground">{hint}</p>
                        </div>
                        <Button asChild size="sm" className="gap-1.5">
                            <a href={`/api/export/${type}`} download>
                                <Download className="size-3.5" />
                                تحميل
                            </a>
                        </Button>
                    </div>
                ))}
            </div>
        </>
    );
}
