import type { IProduct } from '../types/product';
import type { IProductCategory } from '../types/category';
import type { ISupplier } from '../types/supplier';
import type { IPurchaseOrder } from '../types/purchase-order';

export interface IBulkCreateResponse {
    success: number;
    skipped: number;
    errors: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            // Optional: redirect to login
        }
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    get: <T>(url: string) => fetch(`${API_BASE_URL}${url}`, {
        headers: getHeaders()
    }).then((res) => handleResponse<T>(res)),
    post: <T>(url: string, data: unknown) => fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse<T>),
    put: <T>(url: string, data: unknown) => fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse<T>),
    patch: <T>(url: string, data: unknown) => fetch(`${API_BASE_URL}${url}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse<T>),
    delete: <T>(url: string, data?: unknown, isBulk = false) => fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers: getHeaders(),
        ...(isBulk && data ? { body: JSON.stringify(data) } : {})
    }).then((res) => handleResponse<T>(res)),
};

export const productsApi = {
    getProducts: () => api.get<IProduct[]>('/products'),
    getDeletedProducts: () => api.get<IProduct[]>('/products/trash'),
    getProductById: (id: string) => api.get<IProduct>(`/products/${id}`),
    createProduct: (data: Partial<IProduct>) => api.post<IProduct>('/products', data),
    updateProduct: (id: string, data: Partial<IProduct>) => api.put<IProduct>(`/products/${id}`, data),
    deleteProduct: (id: string) => api.delete<{ message: string }>(`/products/${id}`),
    restoreProduct: (id: string) => api.put<IProduct>(`/products/${id}/restore`, {}),
    permanentDeleteProduct: (id: string) => api.delete<{ message: string }>(`/products/${id}/permanent`),
    bulkRestoreProducts: (ids: string[]) => api.put<{ message: string }>('/products/trash/restore-bulk', { ids }),
    bulkPermanentDeleteProducts: (ids: string[]) => api.delete<{ message: string }>('/products/trash/permanent-bulk', { ids }, true),
    emptyProductTrash: () => api.delete<{ message: string }>('/products/trash/empty'),
    bulkCreateProducts: (products: Partial<IProduct>[]) => api.post<IBulkCreateResponse>('/products/bulk', { products }),
};

export const categoriesApi = {
    getCategories: () => api.get<IProductCategory[]>('/product-categories'),
    getDeletedCategories: () => api.get<IProductCategory[]>('/product-categories/trash'),
    createCategory: (data: Partial<IProductCategory>) => api.post<IProductCategory>('/product-categories', data),
    updateCategory: (id: string, data: Partial<IProductCategory>) => api.put<IProductCategory>(`/product-categories/${id}`, data),
    deleteCategory: (id: string) => api.delete<{ message: string }>(`/product-categories/${id}`),
    restoreCategory: (id: string) => api.put<IProductCategory>(`/product-categories/${id}/restore`, {}),
    permanentDeleteCategory: (id: string) => api.delete<{ message: string }>(`/product-categories/${id}/permanent`),
    bulkRestoreCategories: (ids: string[]) => api.put<{ message: string }>('/product-categories/trash/restore-bulk', { ids }),
    bulkPermanentDeleteCategories: (ids: string[]) => api.delete<{ message: string }>('/product-categories/trash/permanent-bulk', { ids }, true),
    emptyCategoryTrash: () => api.delete<{ message: string }>('/product-categories/trash/empty'),
};

export const suppliersApi = {
    getSuppliers: () => api.get<ISupplier[]>('/suppliers'),
    getDeletedSuppliers: () => api.get<ISupplier[]>('/suppliers/trash'),
    createSupplier: (data: Partial<ISupplier>) => api.post<ISupplier>('/suppliers', data),
    updateSupplier: (id: string, data: Partial<ISupplier>) => api.put<ISupplier>(`/suppliers/${id}`, data),
    deleteSupplier: (id: string) => api.delete<{ message: string }>(`/suppliers/${id}`),
    restoreSupplier: (id: string) => api.put<ISupplier>(`/suppliers/${id}/restore`, {}),
    permanentDeleteSupplier: (id: string) => api.delete<{ message: string }>(`/suppliers/${id}/permanent`),
    bulkRestoreSuppliers: (ids: string[]) => api.put<{ message: string }>('/suppliers/trash/restore-bulk', { ids }),
    bulkPermanentDeleteSuppliers: (ids: string[]) => api.delete<{ message: string }>('/suppliers/trash/permanent-bulk', { ids }, true),
    emptySupplierTrash: () => api.delete<{ message: string }>('/suppliers/trash/empty'),
};

export const purchaseOrdersApi = {
    getOrders: () => api.get<IPurchaseOrder[]>('/purchase-orders'),
    getDeletedOrders: () => api.get<IPurchaseOrder[]>('/purchase-orders/trash'),
    getOrderById: (id: string) => api.get<IPurchaseOrder>(`/purchase-orders/${id}`),
    createOrder: (data: Partial<IPurchaseOrder>) => api.post<IPurchaseOrder>('/purchase-orders', data),
    updateOrder: (id: string, data: Partial<IPurchaseOrder>) => api.put<IPurchaseOrder>(`/purchase-orders/${id}`, data),
    deleteOrder: (id: string) => api.delete<{ message: string }>(`/purchase-orders/${id}`),
    restoreOrder: (id: string) => api.put<IPurchaseOrder>(`/purchase-orders/${id}/restore`, {}),
    permanentDeleteOrder: (id: string) => api.delete<{ message: string }>(`/purchase-orders/${id}/permanent`),
    bulkRestoreOrders: (ids: string[]) => api.put<{ message: string }>('/purchase-orders/trash/restore-bulk', { ids }),
    bulkPermanentDeleteOrders: (ids: string[]) => api.delete<{ message: string }>('/purchase-orders/trash/permanent-bulk', { ids }, true),
    emptyOrderTrash: () => api.delete<{ message: string }>('/purchase-orders/trash/empty'),
};
