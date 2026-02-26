import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Check, X, Shield, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth, DEFAULT_PERMS } from "../context/AuthContext"

const PERM_LABELS = {
    siparis: "Sipariş Alma",
    iptal: "Sipariş İptal",
    odeme: "Ödeme Alma",
    kismi: "Kısmi Ödeme",
    menu_edit: "Menü Düzenleme",
    rapor: "Raporlar",
    log: "Log Görüntüleme",
    masa_duzen: "Masa Düzenle",
    kullanici: "Kullanıcı Yönetimi",
}
const ROLE_LABELS = { yetkili: "Yetkili", mudur: "Müdür", personel: "Personel" }

const EMPTY_FORM = { name: "", role: "personel", password: "", perms: { ...DEFAULT_PERMS } }

export default function UsersPage() {
    const { can } = useAuth()
    const [users, setUsers] = useState([])
    const [editUser, setEditUser] = useState(null)
    const [addMode, setAddMode] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [expandedPerms, setExpandedPerms] = useState(null)

    const load = () => fetch('/api/users').then(r => r.json()).then(setUsers)
    useEffect(() => { load() }, [])

    const startAdd = () => {
        setAddMode(true)
        setEditUser(null)
        setForm({ ...EMPTY_FORM, perms: { ...DEFAULT_PERMS } })
    }

    const startEdit = (u) => {
        setEditUser(u)
        setAddMode(false)
        setForm({ name: u.name, role: u.role, password: "", perms: { ...DEFAULT_PERMS, ...u.perms } })
        setExpandedPerms(u.id)
    }

    const cancel = () => { setAddMode(false); setEditUser(null); setExpandedPerms(null) }

    const save = async () => {
        if (!form.name) return
        if (addMode) {
            if (!form.password) { alert("Şifre zorunlu"); return }
            await fetch('/api/users', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
        } else {
            const body = { name: form.name, role: form.role, perms: form.perms }
            if (form.password) body.password = form.password
            await fetch(`/api/users/${editUser.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
        }
        cancel()
        load()
    }

    const del = async (u) => {
        if (!confirm(`"${u.name}" silinsin mi?`)) return
        await fetch(`/api/users/${u.id}`, { method: 'DELETE' })
        load()
    }

    const setPerm = (key, val) => setForm(f => ({ ...f, perms: { ...f.perms, [key]: val } }))

    const presetRole = (role) => {
        let perms = { ...DEFAULT_PERMS }
        if (role === 'yetkili') perms = Object.fromEntries(Object.keys(DEFAULT_PERMS).map(k => [k, true]))
        else if (role === 'mudur') { perms.siparis = true; perms.iptal = true; perms.odeme = true; perms.kismi = true; perms.menu_edit = true; perms.rapor = true; perms.log = true; perms.masa_duzen = true; }
        else { perms.siparis = true; perms.iptal = true; perms.odeme = true; perms.kismi = true; }
        setForm(f => ({ ...f, role, perms }))
    }

    const roleBg = { yetkili: "bg-purple-600/20 text-purple-400", mudur: "bg-blue-600/20 text-blue-400", personel: "bg-zinc-700 text-zinc-400" }

    const FormCard = (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4 flex flex-col gap-4">
            <h3 className="font-black text-white text-sm">{addMode ? "Yeni Kullanıcı Ekle" : "Kullanıcı Düzenle"}</h3>
            <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Ad Soyad</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ahmet Yılmaz"
                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-600" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Rol</label>
                    <select value={form.role} onChange={e => presetRole(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-600 cursor-pointer">
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">{addMode ? "Şifre" : "Yeni Şifre (boş=değişmez)"}</label>
                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••"
                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-600" />
                </div>
            </div>
            {/* Yetki tablosu */}
            <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Shield className="w-3 h-3" /> Yetkiler
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(PERM_LABELS).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer group">
                            <div onClick={() => setPerm(key, !form.perms[key])}
                                className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all cursor-pointer ${form.perms[key] ? "bg-blue-600 border-blue-600" : "border-zinc-600 hover:border-zinc-400"
                                    }`}
                            >
                                {form.perms[key] && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{label}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <button onClick={cancel} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-bold hover:bg-zinc-700 transition-all">İptal</button>
                <button onClick={save} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all">Kaydet</button>
            </div>
        </motion.div>
    )

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-zinc-900">
                <p className="text-xs text-zinc-500 font-medium">{users.length} kullanıcı</p>
                {can('kullanici') && (
                    <button onClick={startAdd} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all">
                        <Plus className="w-3.5 h-3.5" /> Yeni Ekle
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-5">
                <AnimatePresence>{(addMode) && FormCard}</AnimatePresence>
                <div className="flex flex-col gap-2">
                    {users.map(u => (
                        <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="flex items-center gap-4 px-4 py-3">
                                <div className="w-9 h-9 shrink-0 bg-zinc-800 rounded-xl flex items-center justify-center text-base font-black text-white">
                                    {u.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white">{u.name}</p>
                                    <p className="text-[10px] text-zinc-500">ID: {u.id}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${roleBg[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                                {can('kullanici') && (
                                    <div className="flex gap-1">
                                        <button onClick={() => editUser?.id === u.id ? cancel() : startEdit(u)}
                                            className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-all">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => del(u)}
                                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <AnimatePresence>
                                {editUser?.id === u.id && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-zinc-800 overflow-hidden">
                                        <div className="p-4">{FormCard.props.children}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
