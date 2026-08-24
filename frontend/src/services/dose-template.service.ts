import { api } from './api';
import type { IProduct } from '@/types/product';

export interface IDoseTemplateComponent {
    product: IProduct;
    productName?: string;
    productCode?: string;
    quantity: number;
}

export interface IDoseTemplate {
    _id?: string;
    name: string;
    price: number;
    components: IDoseTemplateComponent[];
    createdAt?: string;
    updatedAt?: string;
}

export const doseTemplateService = {
    getTemplates: async (): Promise<IDoseTemplate[]> => {
        return await api.get<IDoseTemplate[]>('/dose-templates');
    },

    createTemplate: async (data: IDoseTemplate): Promise<IDoseTemplate> => {
        return await api.post<IDoseTemplate>('/dose-templates', data);
    },

    deleteTemplate: async (id: string): Promise<void> => {
        await api.delete(`/dose-templates/${id}`);
    }
};
