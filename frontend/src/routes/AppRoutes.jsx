import { Routes, Route } from "react-router-dom"

import Login from "../pages/auth/Login"
import Dashboard from "../pages/dashboard/Dashboard"
import DashboardLayout from "../layouts/DashboardLayout"
import ProtectedRoute from "./ProtectedRoute"

export default function AppRoutes() {

    return (

        <Routes>

            <Route path="/login" element={<Login />} />

            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Dashboard />} />
            </Route>

        </Routes>

    )

}