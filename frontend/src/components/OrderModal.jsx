import { useState } from "react"
import { X, Search, ShoppingBag, Plus, Minus, Receipt, Coffee } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../lib/utils"

/**
 * OrderModal — Masa sipariş yönetimi (tüm ekran boyutlarında çalışır)
 * Props: table, menu, onClose, onAddItem(product), onUpdateQty(id,qty), onRemove(id), onCheckout()
 */
export default function OrderModal({ table, menu, onClose, onAddItem, onUpdateQty, onRemove, onCheckout }) {
    const [search, setSearch] = useState("")
    const [activeCat, setActiveCat] = useState("Tümü")

    const cats = ["Tümü", ...new Set(menu.map(m => m.cat))]
    const filtered = menu.filter(m =>
        (activeCat === "Tümü" || m.cat === activeCat) &&
        m.name.toLowerCase().includes(search.toLowerCase())
    )

    const total = table.orders.reduce((s, o) => s + (parseFloat(o.price) || 0) * (parseInt(o.quantity) || 1), 0)

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[92vh] bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <div>
                        <h2 className="font-black text-white">Masa {table.id} – Sipariş</h2>
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">{table.orders.length} kalem • Toplam: <span className="text-white font-black">{total.toLocaleString('tr-TR')} ₺</span></p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body – 2 sütun */}
                <div className="flex-1 flex overflow-hidden min-h-0">
                    {/* Sol – Ürün seçimi */}
                    <div className="flex-1 flex flex-col border-r border-zinc-800 overflow-hidden">
                        {/* Arama + kategori */}
                        <div className="shrink-0 p-3 border-b border-zinc-800 flex flex-col gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Ürün ara…"
                                    className="w-full pl-8 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 outline-none focus:border-blue-600 transition-colors" />
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                                {cats.map(c => (
                                    <button key={c} onClick={() => setActiveCat(c)}
                                        className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all shrink-0",
                                            activeCat === c ? "bg-blue-600 text-white" : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500"
                                        )}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Ürün ızgarası */}
                        <div className="flex-1 overflow-y-auto p-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {filtered.map(p => (
                                    <button key={p.id} onClick={() => onAddItem(p)}
                                        className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-blue-600/50 rounded-xl text-left flex flex-col gap-1.5 group transition-all active:scale-95">
                                        <p className="text-[9px] text-blue-500 font-bold uppercase">{p.cat}</p>
                                        <p className="text-xs font-bold text-zinc-100 group-hover:text-white leading-tight line-clamp-2">{p.name}</p>
                                        <div className="flex items-center justify-between mt-auto pt-1">
                                            <span className="text-sm font-black text-white">{p.price.toLocaleString('tr-TR')} ₺</span>
                                            <div className="w-5 h-5 bg-zinc-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all">
                                                <Plus className="w-3 h-3 text-zinc-400 group-hover:text-white" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sağ – Adisyon */}
                    <div className="w-72 shrink-0 flex flex-col overflow-hidden">
                        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
                            <ShoppingBag className="w-4 h-4 text-blue-400" />
                            <p className="text-xs font-black text-white">Adisyon</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {table.orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2 py-8">
                                    <Coffee className="w-8 h-8 opacity-20" />
                                    <p className="text-xs italic">Henüz ürün eklenmedi</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <AnimatePresence>
                                        {table.orders.map(o => (
                                            <motion.div key={o.id} layout initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                                className="flex items-center gap-2 p-2 bg-zinc-800 border border-zinc-700 rounded-xl group">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-zinc-100 truncate">{o.name}</p>
                                                    <p className="text-[10px] text-zinc-500">{(parseFloat(o.price) || 0).toLocaleString('tr-TR')} ₺</p>
                                                </div>
                                                {/* Miktar kontrol */}
                                                <div className="flex items-center gap-1 bg-zinc-700 rounded-lg px-1.5 py-1">
                                                    <button onClick={() => onUpdateQty(o.id, (o.quantity || 1) - 1)}
                                                        className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors">
                                                        <Minus className="w-2.5 h-2.5" />
                                                    </button>
                                                    <span className="text-xs font-black text-white min-w-[14px] text-center">{o.quantity || 1}</span>
                                                    <button onClick={() => onUpdateQty(o.id, (o.quantity || 1) + 1)}
                                                        className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-blue-400 transition-colors">
                                                        <Plus className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                                <span className="text-xs font-black text-white min-w-[42px] text-right">
                                                    {((parseFloat(o.price) || 0) * (o.quantity || 1)).toLocaleString('tr-TR')}₺
                                                </span>
                                                <button onClick={() => onRemove(o.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 p-3 border-t border-zinc-800 bg-zinc-900/50">
                            <div className="flex justify-between items-baseline mb-2.5">
                                <span className="text-xs text-zinc-500 font-medium">Toplam</span>
                                <span className="text-xl font-black text-white">{total.toLocaleString('tr-TR')} ₺</span>
                            </div>
                            <button onClick={onCheckout} disabled={table.orders.length === 0}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5" /> Hesabı Kapat
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
