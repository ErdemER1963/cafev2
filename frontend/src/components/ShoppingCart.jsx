import { motion, AnimatePresence } from "framer-motion"
import { Minus, Plus, ShoppingBag, X, AlertCircle } from "lucide-react"

export function ShoppingCart({ items = [], onUpdateQuantity, onRemove, onCheckout, total = 0 }) {
    const displayTotal = typeof total === 'number' ? total : parseFloat(total) || 0

    return (
        <div className="w-full h-full flex flex-col bg-zinc-950 rounded-2xl shadow-xl overflow-hidden border border-zinc-800/80">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600/15 rounded-xl flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white">Adisyon Detayı</h2>
                        <p className="text-[10px] text-zinc-500 font-medium">{items.length} ürün</p>
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <AnimatePresence initial={false}>
                    {items.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full min-h-[150px] flex flex-col items-center justify-center text-zinc-600 gap-3"
                        >
                            <ShoppingBag className="w-10 h-10 opacity-20" />
                            <p className="text-xs font-medium italic">Henüz sipariş eklenmedi</p>
                        </motion.div>
                    ) : (
                        items.map((item) => {
                            const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
                            const itemQty = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1
                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20, height: 0 }}
                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-zinc-100 truncate">{item.name}</p>
                                        <p className="text-[10px] text-zinc-500 font-medium">{itemPrice.toLocaleString('tr-TR')} ₺ / adet</p>
                                    </div>
                                    {/* Qty controls */}
                                    <div className="flex items-center gap-1.5 bg-zinc-800 rounded-lg px-1.5 py-1">
                                        <button
                                            onClick={() => onUpdateQuantity?.(item.id, itemQty - 1)}
                                            className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors rounded"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-black text-white min-w-[16px] text-center">{itemQty}</span>
                                        <button
                                            onClick={() => onUpdateQuantity?.(item.id, itemQty + 1)}
                                            className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-blue-400 transition-colors rounded"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    {/* Subtotal */}
                                    <span className="text-xs font-black text-zinc-100 min-w-[50px] text-right">
                                        {(itemPrice * itemQty).toLocaleString('tr-TR')} ₺
                                    </span>
                                    {/* Remove */}
                                    <button
                                        onClick={() => onRemove?.(item.id)}
                                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            )
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Footer / Checkout */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 shrink-0">
                <div className="flex justify-between items-baseline mb-3">
                    <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Toplam</span>
                    <span className="text-xl font-black text-white">{displayTotal.toLocaleString('tr-TR')} ₺</span>
                </div>
                <button
                    onClick={onCheckout}
                    disabled={items.length === 0}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black transition-all duration-200 active:scale-95 shadow-lg shadow-blue-600/20"
                >
                    {items.length === 0 ? "Sipariş Ekleyin" : "Hesabı Kapat"}
                </button>
            </div>
        </div>
    )
}
