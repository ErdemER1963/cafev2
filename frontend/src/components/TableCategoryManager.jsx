import { useState } from "react"
import { X, Check } from "lucide-react"
import { motion } from "framer-motion"

/**
 * TableCategoryManager
 * Props: tables, categories, onConfirm(tableIds, categoryId), onClose
 *
 * Kural: Zaten başka bir kategoriye atanmış masalar listelenmez.
 * Yalnızca kategorisiz (categoryId === null/undefined) masalar gösterilir.
 */
export default function TableCategoryManager({ tables, categories, onConfirm, onClose }) {
    const [selectedCatId, setSelectedCatId] = useState("")
    const [selectedTableIds, setSelectedTableIds] = useState([])

    // Sadece kategorisiz masalar gösterilir (başka kategoridekiler gizlenir)
    const availableTables = tables.filter(t =>
        t.categoryId === null || t.categoryId === undefined || t.categoryId === 0
    )

    const toggleTable = (id) => setSelectedTableIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

    const selectAll = () => setSelectedTableIds(availableTables.map(t => t.id))
    const clearAll = () => setSelectedTableIds([])

    const handleConfirm = () => {
        if (!selectedCatId || selectedTableIds.length === 0) return
        onConfirm(selectedTableIds, parseInt(selectedCatId))
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <div>
                        <h2 className="font-black text-white">Masa Kategorilendirme</h2>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                            {availableTables.length} kategorisiz masa • {tables.length - availableTables.length} kategorili masa
                        </p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    {/* Kategori seç */}
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                            Atanacak Kategori
                        </label>
                        <select
                            value={selectedCatId}
                            onChange={e => { setSelectedCatId(e.target.value); setSelectedTableIds([]) }}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600 cursor-pointer appearance-none"
                        >
                            <option value="">— Kategori seçin —</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {categories.length === 0 && (
                            <p className="text-xs text-yellow-500 mt-2">⚠️ Önce "Masa Düzenle" sekmesinden kategori oluşturun.</p>
                        )}
                    </div>

                    {/* Masa seçimi – yalnızca kategori seçildikten sonra göster */}
                    {selectedCatId && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    Kategorisiz Masalar ({selectedTableIds.length}/{availableTables.length} seçili)
                                </label>
                                {availableTables.length > 0 && (
                                    <div className="flex gap-2">
                                        <button onClick={selectAll} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">Tümünü Seç</button>
                                        <span className="text-zinc-700">|</span>
                                        <button onClick={clearAll} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-colors">Temizle</button>
                                    </div>
                                )}
                            </div>

                            {availableTables.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-zinc-700 rounded-xl">
                                    <p className="text-sm text-zinc-500">Tüm masalar zaten bir kategoriye atandı.</p>
                                    <p className="text-xs text-zinc-600 mt-1">Masa sayısını artırmak için Ayarlar sekmesine gidin.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
                                    {availableTables.map(t => {
                                        const sel = selectedTableIds.includes(t.id)
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => toggleTable(t.id)}
                                                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl border-2 text-sm font-black transition-all select-none ${sel
                                                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                                                        : t.status === "occupied"
                                                            ? "bg-amber-900/20 border-amber-700/50 text-amber-400"
                                                            : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-blue-600/50 hover:bg-zinc-700"
                                                    }`}
                                            >
                                                {sel && (
                                                    <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <Check className="w-2 h-2 text-white" />
                                                    </div>
                                                )}
                                                <span className="text-[9px] text-zinc-500 font-medium">Masa</span>
                                                <span>{t.id}</span>
                                                {t.status === "occupied" && <span className="text-[8px] text-amber-500">dolu</span>}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Aksiyon butonları */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-bold transition-all"
                        >
                            Vazgeç
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedCatId || selectedTableIds.length === 0}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all"
                        >
                            Tamam – {selectedTableIds.length} masayı ata
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
