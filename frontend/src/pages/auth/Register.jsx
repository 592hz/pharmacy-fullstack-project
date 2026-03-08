import { useState } from "react";
import { register } from "../../services/authService";
import "../../style/auth.css"

export default function Register() {

    const [form, setForm] = useState({
        name: "",
        username: "",
        password: "",
        confirmPassword: ""
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

        setErrors({
            ...errors,
            [e.target.name]: ""
        });
    };

    const validate = () => {

        let newErrors = {};

        if (!form.name) newErrors.name = "Vui lòng nhập họ tên";

        if (!form.username) newErrors.username = "Vui lòng nhập tài khoản";

        if (!form.password) newErrors.password = "Vui lòng nhập mật khẩu";

        if (form.password && form.password.length < 6)
            newErrors.password = "Mật khẩu tối thiểu 6 ký tự";

        if (form.confirmPassword !== form.password)
            newErrors.confirmPassword = "Mật khẩu nhập lại không khớp";

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!validate()) return;

        try {

            await register(form);

            alert("Đăng ký thành công");

            window.location = "/";

        } catch (err) {

            if (err.response?.data?.message === "USERNAME_EXIST") {
                setErrors({ username: "Tài khoản đã tồn tại" });
            } else {
                alert("Đăng ký thất bại");
            }

        }
    };

    return (

        <div className="login-page">

            <div className="login-box">

                <div className="login-logo">
                    <h2>Đăng ký tài khoản</h2>
                </div>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        name="name"
                        placeholder="Họ và tên"
                        value={form.name}
                        onChange={handleChange}
                    />
                    {errors.name && <p className="error">{errors.name}</p>}

                    <input
                        type="text"
                        name="username"
                        placeholder="Tài khoản"
                        value={form.username}
                        onChange={handleChange}
                    />
                    {errors.username && <p className="error">{errors.username}</p>}

                    <div className="password-box">

                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Mật khẩu"
                            value={form.password}
                            onChange={handleChange}
                        />

                        <span
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "🙈" : "👁"}
                        </span>

                    </div>
                    {errors.password && <p className="error">{errors.password}</p>}

                    <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Nhập lại mật khẩu"
                        value={form.confirmPassword}
                        onChange={handleChange}
                    />
                    {errors.confirmPassword && (
                        <p className="error">{errors.confirmPassword}</p>
                    )}

                    <button className="login-btn">
                        Đăng ký
                    </button>

                    <div className="login-links">
                        <a href="/">Đã có tài khoản? Đăng nhập</a>
                    </div>

                </form>

            </div>

        </div>
    );
}