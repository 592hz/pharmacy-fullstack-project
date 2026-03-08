import { useState } from "react"
import {
    FiFileText,
    FiCode,
    FiLogIn,
    FiShoppingCart,
    FiMenu,
    FiBell,
    FiSun,
    FiMoon,
    FiUser
} from "react-icons/fi"

import "../style/Header.css"

export default function Header({ toggleSidebar }) {

    const [showNotify, setShowNotify] = useState(false)
    const [dark, setDark] = useState(false)

    const toggleDark = () => {
        setDark(!dark)
        document.body.classList.toggle("dark")
    }

    return (

        <header className="header">

            <div className="header-left">

                <button
                    className="menu-toggle"
                    onClick={toggleSidebar}
                >
                    <FiMenu />
                </button>

                <div className="logo">
                    Pharmacy
                </div>

                <nav className="menu">
                    <div className="menu-item">
                        <FiFileText />
                        Khai báo
                        <div className="dropdown">
                            <a><FiMenu /> Danh mục nhà cung cấp</a>
                            <a><FiMenu /> Danh mục khách hàng</a>
                            <a><FiMenu /> Danh mục bác sĩ</a>
                            <a><FiMenu /> Danh mục sản phẩm</a>
                            <a><FiMenu /> Danh mục nhóm sản phẩm</a>
                            <a><FiMenu /> Danh mục nhóm thu chi</a>
                            <a><FiMenu /> Danh mục đơn thuốc</a>
                            <a><FiMenu /> Danh mục đơn vị tính</a>
                            <a><FiMenu /> Danh mục hình thức thanh toán</a>
                        </div>
                    </div>
                    <div className="menu-item">
                        <FiCode />
                        Tạo phiếu
                        <div className="dropdown">
                            <a><FiMenu /> Tạo phiếu nhập</a>
                            <a><FiMenu /> Tạo phiếu xuất</a>
                            <a><FiMenu /> Tạo phiếu trả hàng</a>
                            <a><FiMenu /> Tạo phiếu kiểm kê tồn kho </a>
                            <a><FiMenu /> Quản lý thu chi</a>
                            <a><FiMenu /> Dụ trừ hàng hóa</a>
                        </div>
                    </div>
                    <div className="menu-item">
                        <FiLogIn />
                        Nhập hàng
                    </div>

                    <div className="menu-item">
                        <FiShoppingCart />
                        Bán hàng
                    </div>
                </nav>
            </div>
            <div className="header-right">
                <div
                    className="icon"
                    onClick={() => setShowNotify(!showNotify)}
                >
                    <FiBell />
                    <span className="badge">3</span>
                    {showNotify && (
                        <div className="notify-panel">
                            <p>3 thông báo mới</p>
                            <a>Thuốc Paracetamol sắp hết</a>
                            <a>Đơn hàng mới</a>
                            <a>Hàng cận date</a>
                        </div>
                    )}
                </div>
                <div
                    className="icon"
                    onClick={toggleDark}
                >
                    {dark ? <FiSun /> : <FiMoon />}
                </div>

                <div className="user">
                    <FiUser />
                </div>
            </div>
        </header>
    )

}