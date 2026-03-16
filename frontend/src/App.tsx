import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import DashboardLayout from "@/layouts/DashboardLayout"
import AuthLayout from "@/layouts/AuthLayout"
import DashboardPage from "@/pages/DashboardPage"
import SuppliersPage from "@/pages/SuppliersPage"
import CustomersPage from "@/pages/CustomersPage"
import IncomeExpenseCategoriesPage from "@/pages/IncomeExpenseCategoriesPage"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import UnitsPage from "@/pages/UnitsPage"
import PaymentMethodsPage from "@/pages/PaymentMethodsPage"
import ProductCategoriesPage from "@/pages/ProductCategoriesPage"
import ProductsPage from "@/pages/ProductsPage"
import PurchaseOrdersPage from "@/pages/PurchaseOrdersPage"
import PurchaseOrderDetailPage from "@/pages/PurchaseOrderDetailPage"
import CreatePurchaseOrderPage from "@/pages/CreatePurchaseOrderPage"
import ExportManagePage from "@/pages/ExportManagePage"
import ExportOrderDetailPage from "@/pages/ExportOrderDetailPage"

export function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="income-expense-categories" element={<IncomeExpenseCategoriesPage />} />
            <Route path="units" element={<UnitsPage />} />
            <Route path="payment-methods" element={<PaymentMethodsPage />} />
            <Route path="product-categories" element={<ProductCategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="export-manage" element={<ExportManagePage />} />
            <Route path="export-manage/:id" element={<ExportOrderDetailPage />} />
            <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="purchase-orders/create" element={<CreatePurchaseOrderPage />} />
            <Route path="purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
