import { productsApi } from "./api"
import type { IProduct } from "../types/product"

export const productService = {
    getAll: () => productsApi.getProducts(),
    getDeleted: () => productsApi.getDeletedProducts(),
    getById: (id: string) => productsApi.getProductById(id),
    create: (data: Partial<IProduct>) => productsApi.createProduct(data),
    update: (id: string, data: Partial<IProduct>) => productsApi.updateProduct(id, data),
    delete: (id: string) => productsApi.deleteProduct(id),
    restore: (id: string) => productsApi.restoreProduct(id),
    permanentDelete: (id: string) => productsApi.permanentDeleteProduct(id),
    bulkRestore: (ids: string[]) => productsApi.bulkRestoreProducts(ids),
    bulkPermanentDelete: (ids: string[]) => productsApi.bulkPermanentDeleteProducts(ids),
    emptyTrash: () => productsApi.emptyProductTrash(),
    bulkCreate: (products: Partial<IProduct>[]) => productsApi.bulkCreateProducts(products)
}
