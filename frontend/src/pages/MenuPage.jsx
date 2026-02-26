import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Check, X, Package, Search, FolderPlus, FolderMinus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../context/AuthContext"

const emptyForm = { name: "", cat: "", price: "" }

export default function MenuPage() {
    const { can } = useAuth()
    const [menu, setMenu] = useState([])
    const [search, setSearch] = useState("")
    const [editItem, setEditItem] = useState(null)
    const [addMode, setAddMode] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [catList, setCatList] = useState([])        // mevcut kategoriler (string[]
    const [activeCat, setActiveCat] = useState("Tümü")
    const [newCatInput, setNewCatInput] = useState("")  // yeni kategori adı
    const [catManageMode, setCatManageMode] = useState(false)
    const [saveError, setSaveError] = useState("")

    const loadMenu = async () => {
        const data = await fetch('/api/menu').then(r => r.json())
        setMenu(data)
        const unique = [...new Set(data.map(m => m.cat))].sort()
        setCatList(unique)
        return unique
    }

    useEffect(() => { loadMenu() }, [])

    const filtered = menu.filter(m =>
        (activeCat === "Tümü" || m.cat === activeCat) &&
        m.name.toLowerCase().includes(search.toLowerCase())
    )

    // ── Add ──────────────────────────────────────────────────────────
    const startAdd = () => {
        setEditItem(null)
        setSaveError("")
        setForm({ name: "", cat: catList[0] || "", price: "" })
        setAddMode(true)
    }

    const saveAdd = async () => {
        if (!form.name.trim()) { setSaveError("Ürün adı boş olamaz"); return }
        if (!form.cat.trim()) { setSaveError("Kategori boş olamaz"); return }
        if (!form.price || isNaN(parseFloat(form.price))) { setSaveError("Geçerli bir fiyat girin"); return }
        setSaveError("")
        const res = await fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: form.name.trim(), cat: form.cat.trim(), price: parseFloat(form.price) }),
        })
        if (res.ok) {
            setAddMode(false)
            setForm(emptyForm)
            await loadMenu()
        } else {
            setSaveError("Kayıt başarısız")
        }
    }

    // ── Edit ─────────────────────────────────────────────────────────
    const startEdit = (item) => {
        setEditItem(item)
        setSaveError("")
        setForm({ name: item.name, cat: item.cat, price: String(item.price) })
        setAddMode(false)
    }

    const saveEdit = async () => {
        if (!form.name.trim() || !form.cat.trim() || !form.price) { setSaveError("Tüm alanları doldurun"); return }
        await fetch(`/api/menu/${editItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: form.name.trim(), cat: form.cat.trim(), price: parseFloat(form.price) }),
        })
        setEditItem(null)
        setForm(emptyForm)
        loadMenu()
    }

    const cancelForm = () => { setEditItem(null); setAddMode(false); setForm(emptyForm); setSaveError("") }

    // ── Delete ───────────────────────────────────────────────────────
    const delItem = async (item) => {
        if (!confirm(`"${item.name}" silinsin mi?`)) return
        await fetch(`/api/menu/${item.id}`, { method: 'DELETE' })
        loadMenu()
    }

    // ── Kategori yönetimi ──────────────────────────────────────────
    const addCategory = async () => {
        const cat = newCatInput.trim()
        if (!cat || catList.includes(cat)) { setNewCatInput(""); return }
        // Kategoriye boş bir placeholder ürün eklemek yerine sadece listede gösterelim
        // Gerçekte kategori label'ı ürünlerden türüyor; UI'da yeni kategori seçilebilir
        setCatList(prev => [...prev, cat].sort())
        setNewCatInput("")
        setActiveCat(cat)
    }

    const delCategory = async (cat) => {
        const count = menu.filter(m => m.cat === cat).length
        if (count > 0) {
            if (!confirm(`"${cat}" kategorisindeki ${count} ürün de silinecek. Devam edilsin mi?`)) return
            const items = menu.filter(m => m.cat === cat)
            await Promise.all(items.map(i => fetch(`/api/menu/${i.id}`, { method: 'DELETE' })))
        } else {
            setCatList(prev => prev.filter(c => c !== cat))
        }
        if (activeCat === cat) setActiveCat("Tümü")
        loadMenu()
    }

    const displayCats = ["Tümü", ...catList]

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* ── Toolbar ──────────────────────────────────────────────── */}
            <div className="shrink-0 flex flex-wrap items-center gap-2 px-5 py-3 border-b border-zinc-900">
                {/* Kategori sekmeleri */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                    {displayCats.map(c => (
                        <button key={c} onClick={() => setActiveCat(c)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${activeCat === c ? "bg-blue-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
                                }`}
                        >{c}</button>
                    ))}
                </div>

                {/* Sağ taraf */}
                <div className="flex items-center gap-2 ml-auto">
                    <div className="relative w-44">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input type="text" placeholder="Ürün ara…" value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 focus:border-blue-600 rounded-xl text-xs text-zinc-100 outline-none transition-colors" />
                    </div>

                    {can('menu_edit') && (
                        <>
                            <button onClick={() => { setCatManageMode(m => !m); setAddMode(false) }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${catManageMode ? "bg-purple-600/20 border-purple-600/50 text-purple-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"
                                    }`}
                                title="Kategorileri Yönet">
                                <FolderPlus className="w-3.5 h-3.5" />
                                Kategoriler
                            </button>
                            <button onClick={startAdd}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all">
                                <Plus className="w-3.5 h-3.5" /> Yeni Ürün
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Kategori Yönetimi Paneli ─────────────────────────────── */}
            <AnimatePresence>
                {catManageMode && can('menu_edit') && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="shrink-0 overflow-hidden border-b border-zinc-800">
                        <div className="px-5 py-3 bg-purple-950/20 flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Kategori Yönetimi</span>
                            {/* Mevcut kategoriler */}
                            <div className="flex flex-wrap gap-1.5">
                                {catList.map(c => (
                                    <div key={c} className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1">
                                        <span className="text-xs font-bold text-zinc-200">{c}</span>
                                        <button onClick={() => delCategory(c)} className="text-zinc-500 hover:text-red-400 transition-colors ml-1">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {/* Yeni kategori ekle */}
                            <div className="flex items-center gap-1.5 ml-auto">
                                <input value={newCatInput} onChange={e => setNewCatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                                    placeholder="Kategori adı…"
                                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-600 w-40" />
                                <button onClick={addCategory}
                                    className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Yeni Ürün Ekleme Formu ─────────────────────────────── */}
            <AnimatePresence>
                {addMode && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="shrink-0 overflow-hidden border-b border-zinc-800">
                        <div className="px-5 py-4 bg-zinc-900/60">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Yeni Ürün</p>
                            <div className="flex flex-wrap gap-3 items-end">
                                <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Ürün Adı *</label>
                                    <input
                                        autoFocus
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        onKeyDown={e => e.key === 'Enter' && saveAdd()}
                                        placeholder="Türk Kahvesi"
                                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-600 transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-1 w-44">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Kategori *</label>
                                    <select
                                        value={form.cat}
                                        onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}
                                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-600 transition-colors cursor-pointer"
                                    >
                                        {form.cat === "" && <option value="">— Seçin —</option>}
                                        {catList.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1 w-28">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Fiyat (₺) *</label>
                                    <input
                                        type="number" min="0" step="0.5"
                                        value={form.price}
                                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                        onKeyDown={e => e.key === 'Enter' && saveAdd()}
                                        placeholder="45"
                                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-600 transition-colors"
                                    />
                                </div>
                                <div className="flex items-end gap-2 pb-0">
                                    <button onClick={saveAdd}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95">
                                        <Check className="w-3.5 h-3.5" /> Kaydet
                                    </button>
                                    <button onClick={cancelForm}
                                        className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-all">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            {saveError && <p className="text-xs text-red-400 mt-2 font-medium">⚠️ {saveError}</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Ürün Listesi ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-5">
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-zinc-600">
                        <Package className="w-10 h-10 mx-auto opacity-20 mb-2" />
                        <p className="text-sm">
                            {search ? "Aramanızla eşleşen ürün bulunamadı" : "Bu kategoride henüz ürün yok"}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {filtered.map(item => (
                            <motion.div key={item.id} layout
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${editItem?.id === item.id ? "bg-zinc-800 border-blue-600/50" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                    }`}
                            >
                                {editItem?.id === item.id ? (
                                    // ── Düzenleme satırı ────────────────────────────
                                    <>
                                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500" />
                                        <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}
                                            className="w-44 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 cursor-pointer">
                                            {catList.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                            className="w-24 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500" />
                                        <button onClick={saveEdit} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all">
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={cancelForm} className="p-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg transition-all">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                ) : (
                                    // ── Normal görüntü ──────────────────────────────
                                    <>
                                        <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                            <Package className="w-3.5 h-3.5 text-zinc-500" />
                                        </div>
                                        <span className="flex-1 text-sm font-bold text-zinc-100">{item.name}</span>
                                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md font-medium shrink-0">{item.cat}</span>
                                        <span className="text-sm font-black text-white w-20 text-right shrink-0">{item.price.toLocaleString('tr-TR')} ₺</span>
                                        {can('menu_edit') && (
                                            <div className="flex gap-1 shrink-0">
                                                <button onClick={() => startEdit(item)} className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-all">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => delItem(item)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
