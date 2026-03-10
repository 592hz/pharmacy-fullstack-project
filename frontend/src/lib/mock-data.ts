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
