"use client";
import { Trash2, MapPin } from "lucide-react";

import { TransferProductDialog } from "./transfer-product-dialog";
import { EditProductDialog } from "./edit-product-dialog";
import { ConfirmDialog } from "@/components/common";
import { TProduct } from "@/server/models/product";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useDelete, useUpdate } from "@/hooks/api";
import { Card } from "@/ui/card";
import { Input } from "@/components/ui/input";

export function CompanyProductCard({ product }: Readonly<{ product: TProduct }>) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(product.name);
    const inputRef = useRef<HTMLInputElement>(null);

    const { mutate: deleteProduct, isPending: isDeleting } = useDelete(`/api/products/${product._id}`, {
        invalidateKeys: ["products", "companies", "company-products", "locations"],
    });

    const { mutate: updateProduct, isPending: isUpdating } = useUpdate(`/api/products/${product._id}`, {
        invalidateKeys: ["products", "companies", "company-products", "locations"],
        onSuccess: () => setIsEditing(false),
    });

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (editedName.trim() && editedName !== product.name) {
            updateProduct({ name: editedName.trim() });
        } else {
            setEditedName(product.name);
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            setEditedName(product.name);
            setIsEditing(false);
        }
    };

    return (
        <Card contentClassName="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
                <button
                    className="min-w-0 flex-1 space-y-1.5 text-right bg-transparent outline-none border-none p-0 appearance-none"
                    onClick={() => !isEditing && setIsEditing(true)}
                >
                    {isEditing ? (
                        <Input
                            ref={inputRef}
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            disabled={isUpdating}
                            className="h-7 text-sm font-semibold px-2 py-1"
                        />
                    ) : (
                        <h3
                            className="truncate text-sm font-semibold cursor-pointer hover:bg-accent hover:text-accent-foreground px-1 -mx-1 rounded transition-colors"
                            title="انقر لتعديل الاسم"
                        >
                            {product.name}
                        </h3>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        <span>{product.location}</span>
                    </div>
                </button>
                <div className="flex items-center gap-0.5">
                    <TransferProductDialog product={product} />
                    <EditProductDialog product={product} />
                    <ConfirmDialog
                        trigger={
                            <button className="inline-flex size-8 items-center justify-center rounded-md text-destructive hover:bg-accent hover:text-destructive">
                                <Trash2 className="size-3.5" />
                            </button>
                        }
                        title="حذف المنتج"
                        description={
                            <>
                                هل أنت متأكد من حذف <strong>{product.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
                            </>
                        }
                        onConfirm={deleteProduct}
                        isPending={isDeleting}
                    />
                </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs font-semibold">
                    بيع: {formatNumber(product.sellPrice)} ج.م
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                    شراء: {formatNumber(product.buyPrice)} ج.م
                </Badge>
                <span className="text-xs text-muted-foreground">
                    الكمية: <span className="font-semibold text-foreground">{product.count}</span>
                </span>
            </div>
        </Card>
    );
}
