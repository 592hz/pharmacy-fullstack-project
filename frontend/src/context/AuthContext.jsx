import { createContext, useState, useEffect } from "react"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(null)

    useEffect(() => {

        const storedToken = localStorage.getItem("token")

        if (storedToken) {
            setToken(storedToken)
        }

    }, [])

    const loginUser = (token) => {

        localStorage.setItem("token", token)
        setToken(token)

    }

    const logoutUser = () => {

        localStorage.removeItem("token")
        setToken(null)

    }

    return (

        <AuthContext.Provider value={{
            token,
            loginUser,
            logoutUser
        }}>

            {children}

        </AuthContext.Provider>

    )
}