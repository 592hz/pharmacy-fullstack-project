import { categoriesApi } from "./api"

export const productCategoryService = {
    getAll: () => categoriesApi.getCategories(),
    getDeleted: () => categoriesApi.getDeletedCategories(),
    create: (data: any) => categoriesApi.createCategory(data),
    update: (id: string, data: any) => categoriesApi.updateCategory(id, data),
    delete: (id: string) => categoriesApi.deleteCategory(id),
    restore: (id: string) => categoriesApi.restoreCategory(id),
    permanentDelete: (id: string) => categoriesApi.permanentDeleteCategory(id)
}
