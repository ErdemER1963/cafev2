import { useState, useEffect } from "react"
import { Calendar, Trash2, RefreshCw } from "lucide-react"

const today = () => new Date().toISOString().split('T')[0]
const nAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0] }

const TYPE_COLORS = {
    login: "bg-blue-900/40 text-blue-400",
    sale: "bg-emerald-900/40 text-emerald-400",
    menu: "bg-yellow-900/40 text-yellow-400",
    user: "bg-purple-900/40 text-purple-400",
    settings: "bg-zinc-700/60 text-zinc-400",
}

export default function LogsPage() {
    const [logs, setLogs] = useState([])
    const [from, setFrom] = useState(nAgo(7))
    const [to, setTo] = useState(today())
    const [loading, setLoading] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/logs?from=${from}&to=${to}`)
            setLogs(await res.json())
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [from, to])

    const clearAll = async () => {
        if (!confirm("Tüm loglar silinsin mi?")) return
        await fetch('/api/logs', { method: 'DELETE' })
        load()
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Toolbar */}
            <div className="shrink-0 flex flex-wrap items-center gap-3 px-5 py-3 border-b border-zinc-900">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-600" />
                <span className="text-zinc-600 text-xs">—</span>
                <input type="date" value={to} onChange={e => setTo(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-600" />
                <button onClick={load} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all">
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-zinc-600 ml-1">{logs.length} kayıt</span>
                <button onClick={clearAll} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 border border-red-800/50 rounded-xl text-xs font-bold text-red-400 hover:bg-red-900/50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />  Tümünü Sil
                </button>
            </div>

            {/* Log list */}
            <div className="flex-1 overflow-y-auto p-5">
                {loading ? (
                    <div className="flex justify-center pt-10">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-zinc-600">
                        <p className="text-3xl mb-2">📋</p>
                        <p className="text-sm">Bu tarih aralığında log bulunamadı</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {logs.map(log => (
                            <div key={log.id} className="flex items-center gap-4 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all">
                                <span className="text-lg shrink-0 w-7 text-center">{log.icon || '•'}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-zinc-100 truncate">{log.descr}</p>
                                    <p className="text-[10px] text-zinc-600 font-medium">{log.time_str}</p>
                                </div>
                                {log.amount && (
                                    <span className="text-xs font-black text-emerald-400 whitespace-nowrap">{log.amount}</span>
                                )}
                                {log.badge && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[log.type] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                        {log.badge}
                                    </span>
                                )}
                                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg ${TYPE_COLORS[log.type] || 'bg-zinc-800 text-zinc-500'}`}>
                                    {log.type}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
