import Header from "../components/Header"
import { Outlet } from "react-router-dom"

export default function DashboardLayout() {

    return (

        <div>

            {/* HEADER HIỂN THỊ TOÀN BỘ TRANG */}
            <Header />
            {/* NỘI DUNG PAGE */}
            <div style={{ paddingTop: "60px" }}>
                <Outlet />

            </div>

        </div>

    )

}