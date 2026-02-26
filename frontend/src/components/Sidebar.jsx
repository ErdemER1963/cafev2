import { cn } from "../lib/utils"
import { motion } from "framer-motion"
import {
    LayoutDashboard, FileClock, Coffee, Settings,
    UserCircle, LogOut, UtensilsCrossed, ScrollText, FolderOpen
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "../context/AuthContext"

const sidebarVariants = {
    open: { width: "14rem" },
    closed: { width: "4.5rem" },
}

export function Sidebar({ activeTab, onTabChange }) {
    const { user, logout, can } = useAuth()
    const [isCollapsed, setIsCollapsed] = useState(true)

    const menuItems = [
        { id: "tables", name: "Masalar", icon: LayoutDashboard, always: true },
        { id: "menu", name: "Menü Yönetimi", icon: UtensilsCrossed, perm: "menu_edit" },
        { id: "reports", name: "Raporlar", icon: FileClock, perm: "rapor" },
        { id: "logs", name: "Loglar", icon: ScrollText, perm: "log" },
        { id: "users", name: "Kullanıcılar", icon: UserCircle, perm: "kullanici" },
        { id: "settings", name: "Masa Düzenle", icon: FolderOpen, perm: "masa_duzen" },
        { id: "system", name: "Ayarlar", icon: Settings, always: true },
    ].filter(item => item.always || can(item.perm))

    return (
        <motion.div
            className="fixed left-0 top-0 z-40 flex flex-col h-screen bg-zinc-950 border-r border-zinc-900 shadow-2xl shadow-black/50 overflow-hidden"
            initial="closed"
            animate={isCollapsed ? "closed" : "open"}
            variants={sidebarVariants}
            onMouseEnter={() => setIsCollapsed(false)}
            onMouseLeave={() => setIsCollapsed(true)}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="flex flex-col h-full p-3 gap-1">
                {/* Logo */}
                <div className="flex items-center gap-3 px-2 py-3 mb-3 min-w-0">
                    <div className="w-9 h-9 shrink-0 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <Coffee className="w-5 h-5" />
                    </div>
                    <motion.div
                        className="overflow-hidden whitespace-nowrap"
                        animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="font-black text-sm tracking-tight text-white">CAFE PRO</div>
                        <div className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Adisyon v2</div>
                    </motion.div>
                </div>

                {/* Nav */}
                <nav className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                    {menuItems.map(item => {
                        const isActive = activeTab === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                title={item.name}
                                className={cn(
                                    "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all duration-150 relative",
                                    isActive
                                        ? "bg-blue-600/15 text-blue-400"
                                        : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                                )}
                            >
                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full" />}
                                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-400" : "")} />
                                <motion.span
                                    className="text-xs font-semibold whitespace-nowrap overflow-hidden"
                                    animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {item.name}
                                </motion.span>
                            </button>
                        )
                    })}
                </nav>

                {/* User + Logout */}
                <div className="flex flex-col gap-1 pt-2 border-t border-zinc-900">
                    {user && (
                        <div className="flex items-center gap-3 px-2.5 py-2">
                            <div className="w-9 h-9 shrink-0 bg-zinc-800 rounded-xl flex items-center justify-center text-sm font-black text-white">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <motion.div
                                className="overflow-hidden"
                                animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
                                transition={{ duration: 0.15 }}
                            >
                                <p className="text-xs font-bold text-zinc-200 whitespace-nowrap">{user.name}</p>
                                <p className="text-[10px] text-zinc-500 uppercase whitespace-nowrap">{user.role}</p>
                            </motion.div>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        title="Çıkış Yap"
                        className="flex items-center gap-3 w-full p-2.5 rounded-xl text-zinc-600 hover:bg-red-900/20 hover:text-red-400 transition-all"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <motion.span
                            className="text-xs font-semibold whitespace-nowrap overflow-hidden"
                            animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
                            transition={{ duration: 0.15 }}
                        >
                            Çıkış Yap
                        </motion.span>
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
