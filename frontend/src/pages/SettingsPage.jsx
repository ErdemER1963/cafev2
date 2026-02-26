import { useState, useEffect } from "react"
import { Save, Plus, Pencil, Trash2, Check, X } from "lucide-react"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

export default function SettingsPage({ onTableCountChange }) {
    const [tableCount, setTableCount] = useState(20)
    const [inputCount, setInputCount] = useState("20")
    const [cats, setCats] = useState([])
    const [newCat, setNewCat] = useState("")
    const [newColor, setNewColor] = useState(COLORS[0])
    const [editCat, setEditCat] = useState(null)
    const [editForm, setEditForm] = useState({ name: "", color: "" })
    const [saved, setSaved] = useState(false)

    const loadCats = () => fetch('/api/table-categories').then(r => r.json()).then(setCats)

    useEffect(() => {
        fetch('/api/settings').then(r => r.json()).then(d => {
            const c = parseInt(d.table_count) || 20
            setTableCount(c); setInputCount(String(c))
        })
        loadCats()
    }, [])

    const saveCount = async () => {
        const n = parseInt(inputCount)
        if (isNaN(n) || n < 1 || n > 100) { alert("1–100 arası bir sayı girin"); return }
        await fetch('/api/settings/table_count', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: String(n) })
        })
        setTableCount(n)
        onTableCountChange?.()
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const addCat = async () => {
        if (!newCat.trim()) return
        await fetch('/api/table-categories', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newCat.trim(), color: newColor })
        })
        setNewCat(""); loadCats()
    }

    const delCat = async (id) => {
        if (!confirm("Kategori silinsin mi? Bağlı masaların kategorisi kaldırılır.")) return
        await fetch(`/api/table-categories/${id}`, { method: 'DELETE' })
        loadCats()
    }

    const saveCat = async () => {
        await fetch(`/api/table-categories/${editCat}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editForm.name, color: editForm.color })
        })
        setEditCat(null); loadCats()
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto p-5 gap-6">
            {/* Masa Sayısı */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-black text-white mb-4">Masa Sayısı</h3>
                <div className="flex items-center gap-3">
                    <input
                        type="number" value={inputCount}
                        onChange={e => setInputCount(e.target.value)}
                        min={1} max={100}
                        className="w-28 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600 transition-colors"
                    />
                    <button onClick={saveCount}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all active:scale-95">
                        {saved ? <><Check className="w-4 h-4" /> Kaydedildi</> : <><Save className="w-4 h-4" /> Kaydet</>}
                    </button>
                    <span className="text-xs text-zinc-500">Mevcut: {tableCount} masa</span>
                </div>
                <p className="text-[11px] text-zinc-600 mt-2">Değiştirmek programın anlık masa sayısını etkiler. Mevcut siparişler korunur.</p>
            </div>

            {/* Masa Kategorileri */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-black text-white mb-4">Masa Kategorileri</h3>

                {/* Ekle */}
                <div className="flex gap-2 mb-4">
                    <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Kategori adı…"
                        onKeyDown={e => e.key === 'Enter' && addCat()}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
                    <div className="flex gap-1.5 items-center">
                        {COLORS.map(c => (
                            <button key={c} onClick={() => setNewColor(c)}
                                className={`w-5 h-5 rounded-full transition-all ${newColor === c ? "ring-2 ring-offset-1 ring-offset-zinc-900 ring-white scale-110" : ""}`}
                                style={{ backgroundColor: c }} />
                        ))}
                    </div>
                    <button onClick={addCat} className="px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Liste */}
                <div className="flex flex-col gap-2">
                    {cats.map(cat => (
                        <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5 bg-zinc-800 rounded-xl border border-zinc-700">
                            {editCat === cat.id ? (
                                <>
                                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500" />
                                    <div className="flex gap-1">
                                        {COLORS.map(c => (
                                            <button key={c} onClick={() => setEditForm({ ...editForm, color: c })}
                                                className={`w-4 h-4 rounded-full ${editForm.color === c ? "ring-2 ring-offset-1 ring-offset-zinc-800 ring-white" : ""}`}
                                                style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                    <button onClick={saveCat} className="p-1.5 text-emerald-400 hover:bg-zinc-700 rounded-lg transition-all"><Check className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => setEditCat(null)} className="p-1.5 text-zinc-400 hover:bg-zinc-700 rounded-lg transition-all"><X className="w-3.5 h-3.5" /></button>
                                </>
                            ) : (
                                <>
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                    <span className="flex-1 text-sm font-bold text-zinc-100">{cat.name}</span>
                                    <button onClick={() => { setEditCat(cat.id); setEditForm({ name: cat.name, color: cat.color }) }}
                                        className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-zinc-700 rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => delCat(cat.id)}
                                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                </>
                            )}
                        </div>
                    ))}
                    {cats.length === 0 && <p className="text-xs text-zinc-600 text-center py-4">Henüz kategori yok</p>}
                </div>
            </div>

            {/* Günlük Bilgi Notu */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-black text-white mb-2">Günlük Nakit Bilgisi</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                    Günlük nakit/kart istatistikleri her yeni gün otomatik olarak sıfırlanır. Geçmiş satışlar
                    satış raporlarından görüntülenebilir. <strong className="text-zinc-300">Veriler silinmez</strong>, yalnızca
                    gün başındaki özet sayacı sıfırlanır.
                </p>
            </div>
        </div>
    )
}
