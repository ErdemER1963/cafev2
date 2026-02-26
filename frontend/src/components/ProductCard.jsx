import { motion } from "framer-motion"
import { Plus } from "lucide-react"

export function ProductCard({ name, price, cat, category, onAdd }) {
    const displayCategory = cat || category || ""
    const displayPrice = typeof price === 'number' ? price : parseFloat(price) || 0

    return (
        <motion.button
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAdd}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 p-4 rounded-2xl text-left flex flex-col h-full group transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-black/30"
        >
            <div className="flex flex-col flex-1 gap-1 mb-3">
                {displayCategory && (
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                        {displayCategory}
                    </span>
                )}
                <h3 className="text-sm font-bold text-zinc-100 leading-tight group-hover:text-white transition-colors line-clamp-2">
                    {name}
                </h3>
            </div>

            <div className="flex items-center justify-between mt-auto">
                <span className="text-base font-black text-white">{displayPrice.toLocaleString('tr-TR')} ₺</span>
                <div className="p-2 bg-zinc-800 rounded-xl group-hover:bg-blue-600 transition-all duration-200 text-zinc-400 group-hover:text-white shadow-sm">
                    <Plus className="w-4 h-4" />
                </div>
            </div>
        </motion.button>
    )
}
