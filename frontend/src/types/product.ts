export interface IProductBatch {
  batchNumber: string;
  expiryDate: string;
  quantity: number;
}

export interface IProduct {
  _id?: string;
  id: string; // SKU or Barcode
  name: string;
  unit: string;
  importPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  registrationNo?: string;
  isDQG?: boolean;
  manufacturer?: string;
  categoryId?: string | { id: string; name: string }; 
  supplierId?: string | { id: string; name: string };
  baseQuantity: number;
  baseUnitName?: string;
  conversionRate?: number;
  batches?: IProductBatch[];
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
