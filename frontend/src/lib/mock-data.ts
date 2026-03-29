export interface Category {
    id: string
    name: string
    notes: string
    type: "Thu" | "Chi"
    amount: number
    date: string // ISO date string (YYYY-MM-DD or YYYY-MM)
}

export interface Customer {
    id: string
    name: string
    phone: string
    dob: string
    address: string
    gender?: "Nam" | "Nữ" | "Khác"
    weight?: string
    age?: string
    notes?: string
}

export let mockCategories: Category[] = []

export let mockCustomers: Customer[] = [
    {
        id: "KH00001",
        name: "Khách lẻ",
        phone: "",
        dob: "",
        address: "",
    }
]

export const setMockCustomers = (customers: Customer[]) => {
    mockCustomers = customers
}

export const setMockCategories = (newCategories: Category[]) => {
    mockCategories = newCategories
}

import { type Supplier } from "./schemas"

export interface ProductCategory {
    id: string
    name: string
    notes?: string
}

export const mockProductCategories: ProductCategory[] = []

export const mockSuppliersList: Supplier[] = []

// ─── DANH MỤC SẢN PHẨM ──────────────────────────────────────────────────────
export interface ProductBatch {
    batchNumber: string
    expiryDate: string
    quantity: number
}

export interface Product {
    id: string
    productCode?: string
    name: string
    productName?: string
    unit: string
    importPrice: number
    retailPrice: number
    wholesalePrice: number
    registrationNo?: string
    isDQG?: boolean
    manufacturer?: string
    categoryId?: string
    supplierId?: string
    baseQuantity: number
    baseUnitName?: string
    conversionRate?: number
    expiryDate?: string
    batches?: ProductBatch[]
}

export const mockProducts: Product[] = []

// ─── PHIẾU NHẬP ────────────────────────────────────────────────────────────
export interface PurchaseOrderItem {
    id: string
    code: string          // Mã SP (e.g., SP000279)
    name: string          // Tên sản phẩm
    unit: string          // ĐVT (e.g., Hộp, vỉ, Viên)
    batchNumber: string   // Số lô
    expiryDate: string    // Hạn dùng
    quantity: number      // Số lượng
    importPrice: number   // Giá nhập
    retailPrice: number   // Giá bán lẻ
    totalAmount: number   // Tổng tiền = qty * importPrice
    discountPercent: number // %CK
    discountAmount: number  // Chiết khấu (tiền)
    vatPercent: number      // %VAT
    vatAmount: number       // VAT (tiền)
    remainingAmount: number // Còn lại
    registrationNumber: string // SĐK
}

export interface PurchaseOrder {
    id: string            // Số phiếu
    importDate: string    // Ngày nhập (ISO string)
    supplierId: string
    supplierName: string
    totalAmount: number   // Tổng tiền hàng
    discount: number      // Chiết khấu
    vat: number           // VAT
    grandTotal: number    // Tổng cộng
    notes: string
    createdBy: string     // Người tạo
    invoiceNumber: string // Số hóa đơn của NCC
    paymentMethod?: string // HTTT
    items?: PurchaseOrderItem[]
}

export let mockPurchaseOrders: PurchaseOrder[] = []

// ─── PHIẾU XUẤT ────────────────────────────────────────────────────────────
export interface ExportSlipItem {
    id: string
    code: string
    name: string
    unit: string
    batchNumber: string
    expiryDate: string
    quantity: number
    retailPrice: number
    importPrice: number   // Giá nhập
    totalAmount: number
    discountPercent: number
    discountAmount: number
    remainingAmount: number
}

export interface ExportSlip {
    id: string            // Số phiếu
    exportDate: string    // Ngày xuất (ISO string)
    customerId: string
    customerName: string
    customerPhone: string
    totalAmount: number   // Tổng tiền
    grandTotal: number    // Còn lại
    notes: string
    createdBy: string     // Người tạo
    paymentMethod?: string // HTTT
    paymentStatus?: string // Trạng thái thanh toán (Đã thanh toán, Chưa thanh toán...)
    items?: ExportSlipItem[]
    isPrescription?: boolean // Bán theo đơn
    doctorName?: string      // Bác sĩ chỉ định
}

export let mockExportSlips: ExportSlip[] = []

export const setMockExportSlips = (slips: ExportSlip[]) => {
    mockExportSlips = slips
}

export const addMockExportSlip = (slip: ExportSlip) => {
    mockExportSlips = [slip, ...mockExportSlips]
}

export const setMockPurchaseOrders = (orders: PurchaseOrder[]) => {
    mockPurchaseOrders = orders
}

export const addMockPurchaseOrder = (order: PurchaseOrder) => {
    mockPurchaseOrders = [order, ...mockPurchaseOrders]
}

export interface Note {
    id: string
    title: string
    content: string
    date: string
    color?: string
}

export let mockNotes: Note[] = []

export const setMockNotes = (notes: Note[]) => {
    mockNotes = notes
}

export const addMockNote = (note: Note) => {
    mockNotes = [note, ...mockNotes]
}
