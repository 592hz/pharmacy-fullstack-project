import { z } from "zod"

// ─── UTILS ───
const phoneRegex = /^[0-9]{10,11}$/
const dateRegex = /^(\d{2})[-/](\d{2})[-/](\d{4})$/

const dateValidation = z.string().optional().refine((val) => {
    if (!val || val === "." || val === "") return true
    return dateRegex.test(val)
}, "Hạn dùng không hợp lệ (Định dạng: DD-MM-YYYY hoặc DD/MM/YYYY)")

// ─── AUTH ───
export const loginSchema = z.object({
    username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
    password: z.string().min(1, "Vui lòng nhập mật khẩu"),
})

export type Login = z.infer<typeof loginSchema>

export const signupSchema = z.object({
    name: z.string().min(1, "Vui lòng nhập họ tên"),
    username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
})

export type Signup = z.infer<typeof signupSchema>

// ─── CUSTOMER ───
export const customerSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Vui lòng nhập tên khách hàng"),
    phone: z.string().regex(phoneRegex, "Số điện thoại không hợp lệ (10-11 số)").optional().or(z.literal("")),
    dob: z.string().optional(),
    address: z.string().optional(),
    gender: z.enum(["Nam", "Nữ", "Khác"]).default("Nam"),
    weight: z.string().optional(),
    age: z.string().optional(),
    notes: z.string().optional(),
})

export type Customer = z.infer<typeof customerSchema> & { id: string }

// ─── SUPPLIER ───
export const supplierSchema = z.object({
    id: z.string().optional(),
    code: z.string().min(1, "Vui lòng nhập mã nhà cung cấp"),
    name: z.string().min(1, "Vui lòng nhập tên nhà cung cấp"),
    address: z.string().optional(),
    taxCode: z.string().optional(),
    phone: z.string().regex(phoneRegex, "Số điện thoại không hợp lệ (10-11 số)").optional().or(z.literal("")),
    email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
    contactPerson: z.string().optional(),
    businessLicense: z.string().optional(),
    notes: z.string().optional(),
    isNational: z.boolean().default(true).optional(),
    isDefaultImport: z.boolean().default(false).optional(),
    debt: z.number().default(0),
})

export type Supplier = z.infer<typeof supplierSchema> & { id: string }

// ─── PRODUCT ───
export const productUnitSchema = z.object({
    id: z.string(),
    unitName: z.string().min(1, "Vui lòng nhập Tên đơn vị tính"),
    conversionRate: z.number().gt(0, "Tỉ lệ quy đổi phải lớn hơn 0"),
    importPrice: z.number().gte(0, "Giá nhập không được âm"),
    retailPrice: z.number().gte(0, "Giá bán lẻ không được âm"),
    wholesalePrice: z.number().gte(0, "Giá bán buôn không được âm"),
    isDefault: z.boolean().default(false),
})

export const batchSchema = z.object({
    batchNumber: z.string(),
    expiryDate: z.string(),
    quantity: z.number(),
})

export const productSchema = z.object({
    id: z.string().optional(),
    productCode: z.string().min(1, "Mã hàng hóa không được để trống"),
    productName: z.string().min(1, "Vui lòng nhập Tên hàng hóa"),
    name: z.string().optional(), // For backward compatibility
    categoryId: z.string().min(1, "Vui lòng chọn Nhóm hàng hóa"),
    supplierId: z.string().optional().or(z.literal("")),
    vatPercent: z.number().min(0).max(100).default(0),
    discountPercent: z.number().min(0).max(100).default(0),
    initialQuantity: z.number().gte(0, "Số lượng tồn kho không được âm"),
    baseUnitName: z.string().min(1, "Vui lòng nhập Đơn vị cơ bản"),
    unit: z.string().optional(), // For backward compatibility
    importPrice: z.number().optional(), // For backward compatibility
    retailPrice: z.number().optional(), // For backward compatibility
    wholesalePrice: z.number().optional(), // For backward compatibility
    batchNumber: z.string().optional().or(z.literal("")),
    expiryDate: dateValidation,
    units: z.array(productUnitSchema).min(1, "Phải có ít nhất một đơn vị tính"),
    batches: z.array(batchSchema).optional(),
    conversionRate: z.number().optional(),
    baseQuantity: z.number().optional(),
})

export type Product = z.infer<typeof productSchema> & { 
    id: string; 
    name: string; 
    unit: string; 
    importPrice: number; 
    retailPrice: number; 
    wholesalePrice: number;
    baseQuantity: number;
    registrationNo?: string;
    manufacturer?: string;
    isDQG?: boolean;
}

export const productCategorySchema = z.object({
    id: z.string().optional(),
    code: z.string().optional(), // Made optional as backend generates it
    name: z.string().min(1, "Vui lòng nhập tên nhóm hàng hóa"),
    notes: z.string().optional(),
})

export type ProductCategory = z.infer<typeof productCategorySchema> & { id?: string }

export const categorySchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Vui lòng nhập tên"),
    type: z.enum(["Thu", "Chi"]),
    amount: z.number().gte(0),
    date: z.string().optional(),
    notes: z.string().optional(),
})

export type Category = z.infer<typeof categorySchema> & { id?: string }

// ─── PAYMENT METHOD ───
export const paymentMethodSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Vui lòng nhập tên phương thức thanh toán"),
    notes: z.string().optional(),
    isDefault: z.boolean().default(false),
})

export type PaymentMethod = z.infer<typeof paymentMethodSchema> & { id: string }

// ─── UNIT ───
export const unitSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Vui lòng nhập tên đơn vị"),
})

export type Unit = z.infer<typeof unitSchema> & { id: string }

// ─── NOTE ───
export const noteSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, "Vui lòng nhập tiêu đề ghi chú"),
    content: z.string().min(1, "Vui lòng nhập nội dung ghi chú"),
    date: z.string().optional(),
    color: z.string().optional(),
})

export type Note = z.infer<typeof noteSchema> & { id: string; date: string }

// ─── EXPORT ORDER ───
export const exportOrderItemSchema = z.object({
    id: z.string().optional(),
    code: z.string(),
    name: z.string(),
    unit: z.string(),
    batchNumber: z.string().default(""),
    expiryDate: z.string().default(""),
    quantity: z.number().min(0.0001, "Số lượng phải lớn hơn 0"),
    retailPrice: z.number().min(0),
    importPrice: z.number().min(0),
    totalAmount: z.number(),
    discountPercent: z.number().min(0).max(100).default(0),
    discountAmount: z.number().default(0),
    remainingAmount: z.number(),
})

export const exportOrderSchema = z.object({
    id: z.string().optional(),
    exportDate: z.string(),
    customerId: z.string().min(1, "Vui lòng chọn khách hàng"),
    customerName: z.string().min(1, "Vui lòng nhập tên khách hàng"),
    customerPhone: z.string().optional(),
    totalAmount: z.number(),
    grandTotal: z.number(),
    notes: z.string().optional(),
    createdBy: z.string(),
    paymentMethod: z.string(),
    paymentStatus: z.string().default("Đã thanh toán"),
    isPrescription: z.boolean().default(false),
    doctorName: z.string().optional(),
    items: z.array(exportOrderItemSchema).min(1, "Phiếu bán hàng phải có ít nhất một sản phẩm"),
})

export type ExportOrder = z.infer<typeof exportOrderSchema>
export type ExportOrderItem = z.infer<typeof exportOrderItemSchema>

// ─── PURCHASE ORDER ───
export const purchaseOrderItemSchema = z.object({
    id: z.string().optional(),
    code: z.string(),
    name: z.string(),
    unit: z.string(),
    batchNumber: z.string().default(""),
    expiryDate: z.string().default(""),
    quantity: z.number().min(0.0001, "Số lượng phải lớn hơn 0"),
    importPrice: z.number().min(0),
    retailPrice: z.number().min(0),
    totalAmount: z.number(),
    discountPercent: z.number().min(0).max(100).default(0),
    discountAmount: z.number().default(0),
    vatPercent: z.number().min(0).max(100).default(0),
    vatAmount: z.number().default(0),
    remainingAmount: z.number(),
    registrationNumber: z.string().optional(),
})

export const purchaseOrderSchema = z.object({
    id: z.string().optional(),
    importDate: z.string(),
    supplierId: z.string().min(1, "Vui lòng chọn nhà cung cấp"),
    supplierName: z.string().optional(),
    totalAmount: z.number(),
    discount: z.number().default(0),
    vat: z.number().default(0),
    grandTotal: z.number(),
    notes: z.string().optional(),
    createdBy: z.string(),
    invoiceNumber: z.string().optional(),
    paymentMethod: z.string().optional(),
    items: z.array(purchaseOrderItemSchema).min(1, "Phiếu nhập hàng phải có ít nhất một sản phẩm"),
})

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>
export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>

// ─── DASHBOARD ───
export const lowStockProductSchema = z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
})

export type LowStockProduct = z.infer<typeof lowStockProductSchema>

export const nearExpiryProductSchema = z.object({
    name: z.string(),
    batchNumber: z.string(),
    expiryDate: z.string(),
    quantity: z.number(),
    unit: z.string(),
})

export type NearExpiryProduct = z.infer<typeof nearExpiryProductSchema>

export const dashboardSummarySchema = z.object({
    stats: z.object({
        today: z.object({ revenue: z.number(), profit: z.number() }),
        month: z.object({ revenue: z.number(), profit: z.number() }),
        year: z.object({ revenue: z.number(), profit: z.number() }),
        totalIncome: z.number(),
        totalExpense: z.number(),
        lowStockCount: z.number(),
        nearExpiryCount: z.number(),
        billCountToday: z.number(),
        lowStockProducts: z.array(lowStockProductSchema),
        nearExpiryProducts: z.array(nearExpiryProductSchema),
    }),
    chartData: z.object({
        month: z.array(z.object({
            name: z.string(),
            DoanhThu: z.number(),
            LoiNhuan: z.number(),
        }))
    })
})

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>
