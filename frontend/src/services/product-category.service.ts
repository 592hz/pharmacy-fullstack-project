import { categoriesApi } from "./api"
import type { IProductCategory } from "../types/category"

export const productCategoryService = {
    getAll: () => categoriesApi.getCategories(),
    getDeleted: () => categoriesApi.getDeletedCategories(),
    create: (data: Partial<IProductCategory>) => categoriesApi.createCategory(data),
    update: (id: string, data: Partial<IProductCategory>) => categoriesApi.updateCategory(id, data),
    delete: (id: string) => categoriesApi.deleteCategory(id),
    restore: (id: string) => categoriesApi.restoreCategory(id),
    permanentDelete: (id: string) => categoriesApi.permanentDeleteCategory(id),
    bulkRestore: (ids: string[]) => categoriesApi.bulkRestoreCategories(ids),
    bulkPermanentDelete: (ids: string[]) => categoriesApi.bulkPermanentDeleteCategories(ids),
    emptyTrash: () => categoriesApi.emptyCategoryTrash()
}
