import { BrowserRouter, Routes, Route } from "react-router-dom"
import { lazy, Suspense } from "react"
import { Toaster } from "sonner"

import DashboardLayout from "@/layouts/DashboardLayout"
import AuthLayout from "@/layouts/AuthLayout"
import { AuthProvider } from "@/context/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import LoadingScreen from "@/components/LoadingScreen"

// Lazy-loaded pages
const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const SuppliersPage = lazy(() => import("@/pages/SuppliersPage"))
const CustomersPage = lazy(() => import("@/pages/CustomersPage"))
const IncomeExpenseReportPage = lazy(() => import("./pages/IncomeExpenseReportPage"))
const LoginPage = lazy(() => import("@/pages/LoginPage"))
const SignupPage = lazy(() => import("@/pages/SignupPage"))
const UnitsPage = lazy(() => import("@/pages/UnitsPage"))
const PaymentMethodsPage = lazy(() => import("@/pages/PaymentMethodsPage"))
const ProductCategoriesPage = lazy(() => import("@/pages/ProductCategoriesPage"))
const ProductsPage = lazy(() => import("@/pages/ProductsPage"))
const PurchaseOrdersPage = lazy(() => import("@/pages/PurchaseOrdersPage"))
const PurchaseOrderDetailPage = lazy(() => import("@/pages/PurchaseOrderDetailPage"))
const CreatePurchaseOrderPage = lazy(() => import("@/pages/CreatePurchaseOrderPage"))
const ExportManagePage = lazy(() => import("@/pages/ExportManagePage"))
const ExportOrderDetailPage = lazy(() => import("@/pages/ExportOrderDetailPage"))
const CreateExportOrderPage = lazy(() => import("@/pages/CreateExportOrderPage"))
const NotesPage = lazy(() => import("@/pages/NotesPage"))
const StockManagementPage = lazy(() => import("@/pages/StockManagementPage"))
const TrashPage = lazy(() => import("@/pages/TrashPage"))
const RevenueReportPage = lazy(() => import("@/pages/RevenueReportPage"))


export function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="reports/income-expense" element={<IncomeExpenseReportPage />} />
              <Route path="units" element={<UnitsPage />} />
              <Route path="payment-methods" element={<PaymentMethodsPage />} />
              <Route path="product-categories" element={<ProductCategoriesPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="export-manage" element={<ExportManagePage />} />
              <Route path="export-manage/create" element={<CreateExportOrderPage />} />
              <Route path="export-manage/:id" element={<ExportOrderDetailPage />} />
              <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="purchase-orders/create" element={<CreatePurchaseOrderPage />} />
              <Route path="purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="stock" element={<StockManagementPage />} />
              <Route path="reports/revenue" element={<RevenueReportPage />} />
              <Route path="trash" element={<TrashPage />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
