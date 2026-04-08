export interface IPurchaseOrderItem {
    id?: string;
    code: string;
    name: string;
    unit: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    importPrice: number;
    retailPrice: number;
    totalAmount: number;
    discountPercent: number;
    discountAmount: number;
    vatPercent: number;
    vatAmount: number;
    remainingAmount: number;
    registrationNumber?: string;
}

export interface IPurchaseOrder {
    _id?: string;
    id: string;
    importDate: string;
    supplierId: string;
    supplierName: string;
    totalAmount: number;
    discount: number;
    vat: number;
    grandTotal: number;
    notes?: string;
    createdBy: string;
    invoiceNumber?: string;
    paymentMethod?: string;
    items: IPurchaseOrderItem[];
    isDeleted?: boolean;
    deletedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}
