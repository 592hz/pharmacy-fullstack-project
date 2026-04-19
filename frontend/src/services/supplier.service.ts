import { suppliersApi } from './api';
import type { ISupplier } from '../types/supplier';

export const supplierService = {
    getAll: () => suppliersApi.getSuppliers(),
    getDeleted: () => suppliersApi.getDeletedSuppliers(),
    getById: (id: string) => suppliersApi.getSuppliers().then(list => list.find(s => s.id === id) || null), // Backend doesn't have getById for supplier yet, using filter for now or could add it
    create: (data: Partial<ISupplier>) => suppliersApi.createSupplier(data),
    update: (id: string, data: Partial<ISupplier>) => suppliersApi.updateSupplier(id, data),
    delete: (id: string) => suppliersApi.deleteSupplier(id),
    restore: (id: string) => suppliersApi.restoreSupplier(id),
    permanentDelete: (id: string) => suppliersApi.permanentDeleteSupplier(id),
    bulkRestore: (ids: string[]) => suppliersApi.bulkRestoreSuppliers(ids),
    bulkPermanentDelete: (ids: string[]) => suppliersApi.bulkPermanentDeleteSuppliers(ids),
    emptyTrash: () => suppliersApi.emptySupplierTrash(),
};
