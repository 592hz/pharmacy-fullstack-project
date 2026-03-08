export const register = (data) => {

    const users = JSON.parse(localStorage.getItem("users")) || []

    const exist = users.find(u => u.username === data.username)

    if (exist) {
        throw new Error("Username đã tồn tại")
    }

    const newUser = {
        name: data.name,
        username: data.username,
        password: data.password
    }

    users.push(newUser)

    localStorage.setItem("users", JSON.stringify(users))

    return true
}

export const login = (data) => {

    const users = JSON.parse(localStorage.getItem("users")) || []

    const user = users.find(
        u => u.username === data.username && u.password === data.password
    )

    if (!user) {
        throw new Error("Sai tài khoản hoặc mật khẩu")
    }

    const token = "login-success"

    localStorage.setItem("token", token)

    return { token, user }
}

export const logout = () => {
    localStorage.removeItem("token")
}

export const isAuth = () => {
    return localStorage.getItem("token")
}