import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import DashboardLayout from "@/layouts/DashboardLayout"
import AuthLayout from "@/layouts/AuthLayout"
import DashboardPage from "@/pages/DashboardPage"
import SuppliersPage from "@/pages/SuppliersPage"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"

export function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
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
