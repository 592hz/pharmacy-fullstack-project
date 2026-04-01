import { productsApi } from "./api"

export const productService = {
    getAll: () => productsApi.getProducts(),
    getDeleted: () => productsApi.getDeletedProducts(),
    getById: (id: string) => productsApi.getProductById(id),
    create: (data: any) => productsApi.createProduct(data),
    update: (id: string, data: any) => productsApi.updateProduct(id, data),
    delete: (id: string) => productsApi.deleteProduct(id),
    restore: (id: string) => productsApi.restoreProduct(id),
    permanentDelete: (id: string) => productsApi.permanentDeleteProduct(id),
    bulkCreate: (products: any[]) => productsApi.bulkCreateProducts(products)
}
