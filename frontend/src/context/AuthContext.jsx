import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

// Varsayılan izinler şablonu
export const DEFAULT_PERMS = {
    siparis: false,
    iptal: false,
    odeme: false,
    kismi: false,
    menu_edit: false,
    rapor: false,
    log: false,
    masa_duzen: false,
    kullanici: false,
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem("cafe_user")) } catch { return null }
    })

    const login = (userData) => {
        sessionStorage.setItem("cafe_user", JSON.stringify(userData))
        setUser(userData)
    }

    const logout = () => {
        sessionStorage.removeItem("cafe_user")
        setUser(null)
    }

    const can = (perm) => {
        if (!user) return false
        return !!user.perms?.[perm]
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, can }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
