import { motion } from "framer-motion"
import { Clock, Receipt, Users } from "lucide-react"
import { cn } from "../lib/utils"

export function TableCard({ id, status, total, time, orders = [], onClick, active }) {
    const isOccupied = status === "occupied" || (orders && orders.length > 0)
    const displayTotal = typeof total === 'number' ? total : parseFloat(total) || 0

    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={cn(
                "relative p-4 rounded-2xl border-2 text-left flex flex-col gap-3 transition-all duration-200 group w-full",
                active
                    ? "border-blue-500 bg-blue-950/30 ring-2 ring-blue-500/25 shadow-lg shadow-blue-500/10"
                    : isOccupied
                        ? "border-red-900/50 bg-zinc-900 hover:border-red-800/70"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
            )}
        >
            {/* Top row */}
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Masa</span>
                    <span className="text-2xl font-black text-white leading-tight">{id}</span>
                </div>
                <div className={cn(
                    "w-2.5 h-2.5 rounded-full mt-1 shrink-0",
                    isOccupied ? "bg-red-500 shadow-sm shadow-red-500/50 animate-pulse" : "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                )} />
            </div>

            {/* Status / Details */}
            {isOccupied ? (
                <div className="flex flex-col gap-1.5 mt-auto">
                    <div className="flex items-center gap-2">
                        <Receipt className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="text-sm font-black text-white">{displayTotal.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    {orders && orders.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span className="text-[11px] text-zinc-500 font-medium">{orders.length} kalem</span>
                        </div>
                    )}
                    {time && (
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span className="text-[10px] text-zinc-600 truncate">{time}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mt-auto">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-900/30 px-2 py-0.5 rounded-md">
                        Müsait
                    </span>
                </div>
            )}
        </motion.button>
    )
}
