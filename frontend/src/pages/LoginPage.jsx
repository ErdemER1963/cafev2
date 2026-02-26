import { useState, useEffect } from "react"
import { Coffee, LogIn, AlertCircle } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"

export default function LoginPage() {
    const { login } = useAuth()
    const [users, setUsers] = useState([])
    const [selectedId, setSelectedId] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetch('/api/users')
            .then(r => r.json())
            .then(data => setUsers(data))
            .catch(() => setError("Sunucuya bağlanılamadı"))
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!selectedId) { setError("Lütfen bir kullanıcı seçin"); return }
        setLoading(true)
        setError("")
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(selectedId), password }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error); return }
            login(data)
        } catch {
            setError("Sunucu hatası")
        } finally {
            setLoading(false)
        }
    }

    const roleLabel = { yetkili: "Yetkili", mudur: "Müdür", personel: "Personel" }
    const roleBg = {
        yetkili: "bg-purple-600/20 text-purple-400 border-purple-700/50",
        mudur: "bg-blue-600/20 text-blue-400 border-blue-700/50",
        personel: "bg-zinc-700/40 text-zinc-400 border-zinc-700"
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30 mb-4">
                        <Coffee className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">CAFE PRO</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Adisyon Yönetim Sistemi</p>
                </div>

                {/* Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-base font-black text-white mb-5">Giriş Yap</h2>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        {/* Kullanıcı seçimi */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Kullanıcı</label>
                            <select
                                value={selectedId}
                                onChange={e => { setSelectedId(e.target.value); setError("") }}
                                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="">— Seçiniz —</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({roleLabel[u.role] || u.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Şifre */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError("") }}
                                placeholder="••••••"
                                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 transition-colors"
                            />
                        </div>

                        {/* Hata */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 px-3 py-2.5 bg-red-900/30 border border-red-800/50 rounded-xl"
                                >
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    <p className="text-xs text-red-400 font-medium">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-1"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><LogIn className="w-4 h-4" /> Giriş Yap</>
                            )}
                        </button>
                    </form>
                </div>

                {/* User cards */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                    {users.slice(0, 6).map(u => (
                        <button
                            key={u.id}
                            type="button"
                            onClick={() => setSelectedId(String(u.id))}
                            className={`p-2 rounded-xl border text-xs font-bold transition-all ${selectedId === String(u.id) ? "border-blue-500 bg-blue-600/20 text-blue-400" : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                                }`}
                        >
                            <div className="text-base mb-0.5">{u.role === 'yetkili' ? '👑' : u.role === 'mudur' ? '🎩' : '👤'}</div>
                            <div className="truncate">{u.name}</div>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
