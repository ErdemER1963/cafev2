import { useState } from "react"
import { X, CreditCard, Banknote, Check } from "lucide-react"
import { motion } from "framer-motion"

/**
 * CheckoutModal – Tam veya Kısmi ödeme
 * Props: table, onClose, onConfirm(saleData)
 */
export default function CheckoutModal({ table, onClose, onConfirm }) {
    const [mode, setMode] = useState("full")     // "full" | "partial"
    const [payType, setPayType] = useState("nakit")    // "nakit" | "kart" | "karisik"
    const [cashInput, setCashInput] = useState("")
    const [cardInput, setCardInput] = useState("")
    const [selectedIds, setSelectedIds] = useState([])        // kısmi için seçili ürün id'leri

    const total = table.orders.reduce((s, o) => s + (parseFloat(o.price) || 0) * (parseInt(o.quantity) || 1), 0)

    // Kısmi ödeme için seçilen kalemlerin toplamı
    const partialTotal = table.orders
        .filter(o => selectedIds.includes(o.id))
        .reduce((s, o) => s + (parseFloat(o.price) || 0) * (parseInt(o.quantity) || 1), 0)

    const billTotal = mode === "full" ? total : partialTotal

    const toggleSelect = (id) => setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

    const handleConfirm = async () => {
        let cashAmount = 0, cardAmount = 0
        if (payType === "nakit") { cashAmount = billTotal }
        else if (payType === "kart") { cardAmount = billTotal }
        else {
            cashAmount = parseFloat(cashInput) || 0
            cardAmount = parseFloat(cardInput) || 0
        }

        const items = mode === "full"
            ? table.orders
            : table.orders.filter(o => selectedIds.includes(o.id))

        await onConfirm({
            items,
            total: billTotal,
            cashAmount,
            cardAmount,
            payType,
            partial: mode === "partial",
            tableId: table.id,
        })
        onClose()
    }

    const canConfirm = mode === "full"
        ? (payType !== "karisik" || ((parseFloat(cashInput) || 0) + (parseFloat(cardInput) || 0) >= billTotal - 0.01))
        : selectedIds.length > 0

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <h2 className="font-black text-white">Masa {table.id} – Hesap Kapat</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-5">
                    {/* Tam / Kısmi mod seçimi */}
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Ödeme Türü</p>
                        <div className="flex gap-2">
                            {[["full", "Tam Hesap"], ["partial", "Kısmi Hesap"]].map(([v, l]) => (
                                <button key={v} onClick={() => { setMode(v); setSelectedIds([]) }}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${mode === v ? "bg-blue-600 border-blue-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                                        }`}>{l}</button>
                            ))}
                        </div>
                    </div>

                    {/* Kısmi mod: ürün seçimi */}
                    {mode === "partial" && (
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Ödenecek Ürünleri Seçin</p>
                            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                                {table.orders.map(o => {
                                    const sel = selectedIds.includes(o.id)
                                    return (
                                        <button key={o.id} onClick={() => toggleSelect(o.id)}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-left ${sel ? "bg-blue-900/30 border-blue-700/50" : "bg-zinc-800 border-zinc-700 hover:border-zinc-500"
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${sel ? "bg-blue-600 border-blue-600" : "border-zinc-600"}`}>
                                                {sel && <Check className="w-2.5 h-2.5 text-white" />}
                                            </div>
                                            <span className="flex-1 text-sm font-medium text-zinc-100">{o.name}</span>
                                            <span className="text-xs text-zinc-400">x{o.quantity}</span>
                                            <span className="text-sm font-bold text-white">{((parseFloat(o.price) || 0) * (parseInt(o.quantity) || 1)).toLocaleString('tr-TR')} ₺</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Ödeme yöntemi */}
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Ödeme Yöntemi</p>
                        <div className="flex gap-2">
                            {[["nakit", "Nakit", "💵"], ["kart", "Kart", "💳"], ["karisik", "Karışık", "🔀"]].map(([v, l, icon]) => (
                                <button key={v} onClick={() => setPayType(v)}
                                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-bold transition-all border ${payType === v ? "bg-blue-600 border-blue-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                                        }`}>
                                    <span className="text-lg">{icon}</span>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Karışık ödeme girişleri */}
                    {payType === "karisik" && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Nakit (₺)</label>
                                <input type="number" value={cashInput} onChange={e => setCashInput(e.target.value)} placeholder="0"
                                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Kart (₺)</label>
                                <input type="number" value={cardInput} onChange={e => setCardInput(e.target.value)} placeholder="0"
                                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
                            </div>
                        </div>
                    )}

                    {/* Tutar özeti */}
                    <div className="flex justify-between items-center px-4 py-3 bg-zinc-800 rounded-xl">
                        <span className="text-sm text-zinc-400 font-medium">Ödenecek Tutar</span>
                        <span className="text-xl font-black text-white">{billTotal.toLocaleString('tr-TR')} ₺</span>
                    </div>

                    {/* Aksiyon */}
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                    >
                        {mode === "partial" ? "Seçilen Ürünleri Öde" : "Hesabı Kapat"}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
