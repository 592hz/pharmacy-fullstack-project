export interface Category {
    id: string
    name: string
    notes: string
    type: "Thu" | "Chi"
    amount: number
}
// tạo dữ liệu giả cho danh mục thu chi để test
export let mockCategories: Category[] = [
    {
        id: "1",
        name: "Chi phí nhân công",
        notes: "",
        type: "Chi",
        amount: 15000000
    },
    {
        id: "2",
        name: "Chi phí quản lý (văn phòng phẩm,...)",
        notes: "",
        type: "Chi",
        amount: 2500000
    },
    {
        id: "3",
        name: "Chi phí mặt bằng",
        notes: "",
        type: "Chi",
        amount: 12000000
    },
    {
        id: "4",
        name: "Chi phí điện nước",
        notes: "",
        type: "Chi",
        amount: 3200000
    },
    {
        id: "5",
        name: "Doanh thu bán lẻ",
        notes: "",
        type: "Thu",
        amount: 45000000
    },
    {
        id: "6",
        name: "Doanh thu sỉ",
        notes: "",
        type: "Thu",
        amount: 120000000
    },
    {
        id: "7",
        name: "Thu chi khác",
        notes: "",
        type: "Thu",
        amount: 1500000
    },
]

// Simple helper to allow updating the reference globally
export const setMockCategories = (newCategories: Category[]) => {
    mockCategories = newCategories
}

// ─── DANH MỤC SẢN PHẨM ──────────────────────────────────────────────────────
export interface Product {
    id: string
    name: string
    unit: string
    importPrice: number
    retailPrice: number
    wholesalePrice: number
    registrationNo?: string
}

export const mockProducts: Product[] = [
    { id: "SP000024",  name: "Amariston 10mg", unit: "Hộp", importPrice: 3000, retailPrice: 7000, wholesalePrice: 7000, registrationNo: "." },
    { id: "SP000161",  name: "Amoxicillin 500 mekophar (h/100v)", unit: "Hộp", importPrice: 67428, retailPrice: 100000, wholesalePrice: 100000, registrationNo: "." },
    { id: "SP000221",  name: "AUGBACTAM 625 (HCN/1túi/2vỉ/5VNBP)", unit: "Viên", importPrice: 2524, retailPrice: 8000, wholesalePrice: 6000, registrationNo: "." },
    { id: "SP000290",  name: "Bromhexin 8mg Us pharma (C/200v)", unit: "Viên", importPrice: 73, retailPrice: 100, wholesalePrice: 100, registrationNo: "." },
    { id: "SP000152",  name: "Cao xoa bóp bạch hổ hoạt lạc bảo linh (lọ/20g)", unit: "Chai", importPrice: 20271, retailPrice: 25000, wholesalePrice: 25000, registrationNo: "." },
    { id: "SP000287",  name: "Celecoxib 200mg Khapharco (Chai/500 viên)", unit: "Viên", importPrice: 450, retailPrice: 500, wholesalePrice: 500, registrationNo: "." },
    { id: "SP000181",  name: "Dầu gội chống gàu selsun 1% rohto (c/100ml)", unit: "Hộp", importPrice: 68888, retailPrice: 75000, wholesalePrice: 75000, registrationNo: "." },
    { id: "SP000191",  name: "DHA 9000 IQ BRAIN (h/10vỉ*10viên)", unit: "Hộp", importPrice: 40740, retailPrice: 100000, wholesalePrice: 100000, registrationNo: "." },
    { id: "SP000177",  name: "Efferalgan 150 Bristol-Myers Squibb (h/10v)", unit: "Hộp", importPrice: 28619, retailPrice: 40000, wholesalePrice: 35000, registrationNo: "." },
    { id: "SP000120",  name: "GẠC Y TẾ 8 CON NAI 8CM X 9CM X 8 LỚP", unit: "Gói", importPrice: 5800, retailPrice: 10000, wholesalePrice: 8000, registrationNo: "." },
    { id: "SP000186",  name: "Gentrisone cream shinpoong (t/20g)", unit: "Hộp", importPrice: 20000, retailPrice: 25000, wholesalePrice: 25000, registrationNo: "." },
    { id: "SP000150",  name: "Ho astex siro opc (c/90ml)", unit: "Chai", importPrice: 37238, retailPrice: 40000, wholesalePrice: 40000, registrationNo: "." },
    { id: "SP000146",  name: "Khẩu trang y tế 4 lớp Khánh An trắng", unit: "Hộp", importPrice: 18500, retailPrice: 30000, wholesalePrice: 25000, registrationNo: "." },
    { id: "SP000281",  name: "Marvelon Organon (H/63v)", unit: "Hộp", importPrice: 206880, retailPrice: 225000, wholesalePrice: 225000, registrationNo: "." },
    { id: "SP000310",  name: "Paracetamol 500mg Mekophar (h/100v)", unit: "Viên", importPrice: 120, retailPrice: 200, wholesalePrice: 180, registrationNo: "." },
    { id: "SP000315",  name: "Vitamin C 500mg DHG (h/100v)", unit: "Viên", importPrice: 180, retailPrice: 300, wholesalePrice: 250, registrationNo: "." },
    { id: "SP000322",  name: "Oresol OPC bột pha uống (h/10gói)", unit: "Gói", importPrice: 3500, retailPrice: 5000, wholesalePrice: 4500, registrationNo: "." },
    { id: "SP000330",  name: "Ibuprofen 400mg Stella (h/100v)", unit: "Viên", importPrice: 250, retailPrice: 400, wholesalePrice: 350, registrationNo: "." },
]

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

export let mockPurchaseOrders: PurchaseOrder[] = [
    {
        id: "00195009",
        importDate: "2026-02-27T20:22:00",
        supplierId: "NCC00006",
        supplierName: "CÔNG TY CP DƯỢC PHẨM MEDX",
        totalAmount: 1770528,
        discount: 108893,
        vat: 77819,
        grandTotal: 1739454,
        notes: "",
        createdBy: "Quản trị viên",
        invoiceNumber: "00195009",
        paymentMethod: "Chuyển khoản",
        items: [
            {
                id: "1",
                code: "SP000279",
                name: "V.Rohto Cool Rohto (C/12ml)",
                unit: "Hộp",
                batchNumber: "LB02",
                expiryDate: "17-12-2028",
                quantity: 3,
                importPrice: 50952,
                retailPrice: 55000,
                totalAmount: 152856,
                discountPercent: 0,
                discountAmount: 15285,
                vatPercent: 5,
                vatAmount: 6880,
                remainingAmount: 144481,
                registrationNumber: "-",
            },
            {
                id: "2",
                code: "SP000280",
                name: "Mecafort Biolab (H/21v)",
                unit: "Hộp",
                batchNumber: "1256400",
                expiryDate: "26-06-2026",
                quantity: 3,
                importPrice: 56095,
                retailPrice: 70000,
                totalAmount: 168285,
                discountPercent: 0,
                discountAmount: 5598,
                vatPercent: 5,
                vatAmount: 8134,
                remainingAmount: 170821,
                registrationNumber: "-",
            },
            {
                id: "3",
                code: "SP000284",
                name: "Marvelon Organon (H/63v)",
                unit: "vỉ",
                batchNumber: "C127303",
                expiryDate: "14-04-2026",
                quantity: 6,
                importPrice: 69460,
                retailPrice: 75000,
                totalAmount: 416760,
                discountPercent: 0,
                discountAmount: 6932,
                vatPercent: 5,
                vatAmount: 20491,
                remainingAmount: 430319,
                registrationNumber: "-",
            },
            {
                id: "4",
                code: "SP000285",
                name: "Amoxicillin/Acid clavulanic 875mg/125mg Buymed (Hộp/2vỉ/7viên)",
                unit: "Viên",
                batchNumber: "411025",
                expiryDate: "04-10-2027",
                quantity: 1,
                importPrice: 0,
                retailPrice: 7000,
                totalAmount: 0,
                discountPercent: 0,
                discountAmount: 0,
                vatPercent: 5,
                vatAmount: 0,
                remainingAmount: 0,
                registrationNumber: "-",
            },
            {
                id: "5",
                code: "SP000286",
                name: "Newchoice Nam Hà (H/25vỉ/28v)",
                unit: "Hộp",
                batchNumber: "25124",
                expiryDate: "06-04-2030",
                quantity: 25,
                importPrice: 10111,
                retailPrice: 10000,
                totalAmount: 252775,
                discountPercent: 0,
                discountAmount: 25226,
                vatPercent: 5,
                vatAmount: 11377,
                remainingAmount: 238926,
                registrationNumber: "1",
            },
            {
                id: "6",
                code: "SP000287",
                name: "Celecoxib 200mg Khapharco (Chai/500 viên nang)",
                unit: "Viên",
                batchNumber: "6151225",
                expiryDate: "21-12-2028",
                quantity: 500,
                importPrice: 450,
                retailPrice: 500,
                totalAmount: 225000,
                discountPercent: 0,
                discountAmount: 22455,
                vatPercent: 5,
                vatAmount: 10127,
                remainingAmount: 212572,
                registrationNumber: "-",
            },
            {
                id: "7",
                code: "SP000288",
                name: "V.Rohto Vitamin Rohto (C/13ml)",
                unit: "Hộp",
                batchNumber: "JB02C",
                expiryDate: "02-10-2026",
                quantity: 3,
                importPrice: 49904,
                retailPrice: 55000,
                totalAmount: 149712,
                discountPercent: 0,
                discountAmount: 4900,
                vatPercent: 5,
                vatAmount: 7237,
                remainingAmount: 151969,
                registrationNumber: "1",
            },
            {
                id: "8",
                code: "SP000289",
                name: "Salonpas dán Hisamitsu (H/10túi/20m)",
                unit: "Bịch",
                batchNumber: "B0412",
                expiryDate: "11-04-2026",
                quantity: 20,
                importPrice: 14047,
                retailPrice: 15000,
                totalAmount: 280940,
                discountPercent: 0,
                discountAmount: 28037,
                vatPercent: 5,
                vatAmount: 12645,
                remainingAmount: 265548,
                registrationNumber: "-",
            },
            {
                id: "9",
                code: "SP000290",
                name: "Bromhexin-us bromhexin 8mg Us pharma (C/200v)",
                unit: "Viên",
                batchNumber: "040724",
                expiryDate: "23-07-2027",
                quantity: 200,
                importPrice: 73,
                retailPrice: 100,
                totalAmount: 14600,
                discountPercent: 0,
                discountAmount: 0,
                vatPercent: 5,
                vatAmount: 730,
                remainingAmount: 15330,
                registrationNumber: "-",
            },
            {
                id: "10",
                code: "SP000291",
                name: "Tiffydey thai nakorn (G/100v)",
                unit: "vỉ",
                batchNumber: "1411225",
                expiryDate: "18-12-2030",
                quantity: 25,
                importPrice: 4384,
                retailPrice: 5000,
                totalAmount: 109600,
                discountPercent: 0,
                discountAmount: 410,
                vatPercent: 5,
                vatAmount: 198,
                remainingAmount: 109388,
                registrationNumber: "-",
            }
        ]
    },
    {
        id: "00012165",
        importDate: "2026-01-20T13:50:22",
        supplierId: "NCC00015",
        supplierName: "CÔNG TY CỔ PHẦN THƯƠNG MẠI DƯỢC VƯƠNG",
        totalAmount: 1364044,
        discount: 0,
        vat: 79653,
        grandTotal: 1443697,
        notes: "",
        createdBy: "Quản trị viên",
        invoiceNumber: "00012165",
        items: [
            {
                id: "1",
                code: "SP000024",
                name: "Amariston 10mg",
                unit: "Hộp",
                batchNumber: "BATCH-1",
                expiryDate: "20-12-2027",
                quantity: 10,
                importPrice: 3000,
                retailPrice: 7000,
                totalAmount: 30000,
                discountPercent: 0,
                discountAmount: 0,
                vatPercent: 5,
                vatAmount: 1500,
                remainingAmount: 31500,
                registrationNumber: "-",
            }
        ]
    },
    {
        id: "DUOC200008",
        importDate: "2026-01-08T21:33:00",
        supplierId: "NCC00015",
        supplierName: "CÔNG TY CỔ PHẦN THƯƠNG MẠI DƯỢC VƯƠNG",
        totalAmount: 1366296,
        discount: 34700,
        vat: 58183,
        grandTotal: 1389779,
        notes: "",
        createdBy: "Quản trị viên",
        invoiceNumber: "00004497",
        items: [
            {
                id: "1",
                code: "SP000161",
                name: "Amoxicillin 500 mekophar (h/100v)",
                unit: "Hộp",
                batchNumber: "AX-2026",
                expiryDate: "15-05-2026",
                quantity: 5,
                importPrice: 67428,
                retailPrice: 100000,
                totalAmount: 337140,
                discountPercent: 0,
                discountAmount: 0,
                vatPercent: 5,
                vatAmount: 16857,
                remainingAmount: 353997,
                registrationNumber: "-",
            }
        ]
    },
    {
        id: "DUOC200009",
        importDate: "2026-01-02T21:11:56",
        supplierId: "NCC00006",
        supplierName: "CÔNG TY CP DƯỢC PHẨM MEDX",
        totalAmount: 2393490,
        discount: 34860,
        vat: 118880,
        grandTotal: 2477570,
        notes: "",
        createdBy: "Quản trị viên",
        invoiceNumber: "02034170",
    },
    {
        id: "PN2025001",
        importDate: "2025-12-15T09:00:00",
        supplierId: "NCC00014",
        supplierName: "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ DƯỢC CHÂU THỊNH PHÁT",
        totalAmount: 3250000,
        discount: 50000,
        vat: 162500,
        grandTotal: 3362500,
        notes: "Hàng nhập trước Tết",
        createdBy: "Quản trị viên",
        invoiceNumber: "CTP20251201",
    },
    {
        id: "PN2025002",
        importDate: "2025-12-10T10:30:00",
        supplierId: "NCC00010",
        supplierName: "CÔNG TY TNHH UMED VIỆT NAM",
        totalAmount: 1800000,
        discount: 0,
        vat: 90000,
        grandTotal: 1890000,
        notes: "",
        createdBy: "Quản trị viên",
        invoiceNumber: "UMED20251001",
    },
    {
        id: "PN2025003",
        importDate: "2025-11-20T14:00:00",
        supplierId: "NCC00009",
        supplierName: "CÔNG TY TNHH THƯƠNG MẠI VÀ DƯỢC PHẨM BALE PHARMA",
        totalAmount: 4500000,
        discount: 100000,
        vat: 220000,
        grandTotal: 4620000,
        notes: "",
        createdBy: "Quản trị viên",
        invoiceNumber: "BALE115001",
    },
    {
        id: "PN2025004",
        importDate: "2025-11-05T08:15:00",
        supplierId: "NCC00013",
        supplierName: "CÔNG TY TNHH DƯỢC AN THÀNH PHÁT",
        totalAmount: 2100000,
        discount: 21000,
        vat: 103950,
        grandTotal: 2182950,
        notes: "Thuốc kháng sinh",
        createdBy: "Quản trị viên",
        invoiceNumber: "ATP110001",
    },
    {
        id: "PN2025005",
        importDate: "2025-10-28T16:00:00",
        supplierId: "NCC00005",
        supplierName: "CÔNG TY TNHH THƯƠNG MẠI VTYT HUY HOÀNG",
        totalAmount: 980000,
        discount: 0,
        vat: 49000,
        grandTotal: 1029000,
        notes: "Vật tư y tế",
        createdBy: "Quản trị viên",
        invoiceNumber: "HH100023",
    },
    {
        id: "PN2025006",
        importDate: "2025-10-10T11:00:00",
        supplierId: "NCC00006",
        supplierName: "CÔNG TY CP DƯỢC PHẨM MEDX",
        totalAmount: 5600000,
        discount: 112000,
        vat: 274400,
        grandTotal: 5762400,
        notes: "",
        createdBy: "Quản trị viên",
        invoiceNumber: "MEDX100088",
    },
    {
        id: "PN2025007",
        importDate: "2025-09-18T09:30:00",
        supplierId: "NCC00011",
        supplierName: "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ THUẬN PHÁT VN",
        totalAmount: 760000,
        discount: 0,
        vat: 38000,
        grandTotal: 798000,
        notes: "",
        createdBy: "Quản trị viên",
        invoiceNumber: "TP090012",
    },
    {
        id: "PN2025008",
        importDate: "2025-09-01T08:00:00",
        supplierId: "NCC00008",
        supplierName: "CÔNG TY CỔ PHẦN DƯỢC PHẨM MEDX",
        totalAmount: 3800000,
        discount: 76000,
        vat: 186200,
        grandTotal: 3910200,
        notes: "Đơn hàng định kỳ",
        createdBy: "Quản trị viên",
        invoiceNumber: "MEDX090044",
    },
]

export const setMockPurchaseOrders = (orders: PurchaseOrder[]) => {
    mockPurchaseOrders = orders
}

export const addMockPurchaseOrder = (order: PurchaseOrder) => {
    mockPurchaseOrders = [order, ...mockPurchaseOrders]
}
