import { useState } from "react"
import { login } from "../../services/authService"
import { toast } from "react-toastify"
import { useNavigate, Link } from "react-router-dom"
import "../../style/auth.css"

export default function Login({ setToken }) {

    const navigate = useNavigate()

    const [form, setForm] = useState({
        username: "",
        password: ""
    })

    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {

        const { name, value } = e.target

        setForm((prev) => ({
            ...prev,
            [name]: value
        }))

        setErrors((prev) => ({
            ...prev,
            [name]: ""
        }))
    }

    const validate = () => {

        const newErrors = {}

        if (!form.username.trim()) {
            newErrors.username = "Vui lòng nhập tài khoản"
        }

        if (!form.password.trim()) {
            newErrors.password = "Vui lòng nhập mật khẩu"
        }

        setErrors(newErrors)

        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {

        e.preventDefault()

        if (!validate()) return

        setLoading(true)

        try {

            const res = await login(form)

            // Lưu token từ API
            const token = res?.data?.token || "login-success"

            localStorage.setItem("token", token)

            if (setToken) {
                setToken(token)
            }

            toast.success("Đăng nhập thành công")

            navigate("/")

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "User không tồn tại hoặc mật khẩu sai"
            )

        } finally {

            setLoading(false)

        }
    }

    return (

        <div className="login-page">

            <div className="login-box">

                <div className="login-logo">
                    <h2>Ngọc Mỹ Pharmacy</h2>
                </div>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        name="username"
                        placeholder="Tài khoản"
                        value={form.username}
                        onChange={handleChange}
                    />

                    {errors.username && (
                        <p className="error-text">{errors.username}</p>
                    )}

                    <input
                        type="password"
                        name="password"
                        placeholder="Mật khẩu"
                        value={form.password}
                        onChange={handleChange}
                    />

                    {errors.password && (
                        <p className="error-text">{errors.password}</p>
                    )}

                    <div className="login-links">

                        <Link to="/register">
                            Đăng ký mới
                        </Link>

                        <Link to="#">
                            Quên mật khẩu?
                        </Link>

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-btn"
                    >
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>

                </form>

            </div>

            <div className="login-footer">
                Hotline: 082207848
            </div>

        </div>

    )
}