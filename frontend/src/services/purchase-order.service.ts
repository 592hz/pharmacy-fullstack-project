import { purchaseOrdersApi } from './api';
import type { IPurchaseOrder } from '../types/purchase-order';

export const purchaseOrderService = {
    getAll: () => purchaseOrdersApi.getOrders(),
    getDeleted: () => purchaseOrdersApi.getDeletedOrders(),
    getById: (id: string) => purchaseOrdersApi.getOrderById(id),
    create: (data: Partial<IPurchaseOrder>) => purchaseOrdersApi.createOrder(data),
    update: (id: string, data: Partial<IPurchaseOrder>) => purchaseOrdersApi.updateOrder(id, data),
    delete: (id: string) => purchaseOrdersApi.deleteOrder(id),
    restore: (id: string) => purchaseOrdersApi.restoreOrder(id),
    permanentDelete: (id: string) => purchaseOrdersApi.permanentDeleteOrder(id),
    bulkRestore: (ids: string[]) => purchaseOrdersApi.bulkRestoreOrders(ids),
    bulkPermanentDelete: (ids: string[]) => purchaseOrdersApi.bulkPermanentDeleteOrders(ids),
    emptyTrash: () => purchaseOrdersApi.emptyOrderTrash()
};
