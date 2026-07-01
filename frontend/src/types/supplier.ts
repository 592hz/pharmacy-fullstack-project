export interface ISupplier {
  _id?: string;
  id?: string;
  code: string;
  name: string;
  address?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  businessLicense?: string;
  notes?: string;
  isNational: boolean;
  isDefaultImport: boolean;
  debt: number;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
