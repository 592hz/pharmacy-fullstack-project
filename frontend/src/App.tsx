import { BrowserRouter, Routes, Route } from "react-router-dom"
import DashboardLayout from "@/layouts/DashboardLayout"
import AuthLayout from "@/layouts/AuthLayout"
import DashboardPage from "@/pages/DashboardPage"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
