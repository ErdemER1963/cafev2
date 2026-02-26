import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, BarChart3, Calendar, ArrowUpDown } from "lucide-react"
import { motion } from "framer-motion"

const today = () => new Date().toISOString().split('T')[0]
const nDaysAgo = (n) => {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0]
}

export default function ReportsPage() {
    const [group, setGroup] = useState("day")
    const [from, setFrom] = useState(nDaysAgo(30))
    const [to, setTo] = useState(today())
    const [summary, setSummary] = useState([])
    const [topProducts, setTopProducts] = useState([])
    const [lowProducts, setLowProducts] = useState([])
    const [loading, setLoading] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const [sumRes, topRes, lowRes] = await Promise.all([
                fetch(`/api/reports/summary?from=${from}&to=${to}&group=${group}`),
                fetch(`/api/reports/top-products?from=${from}&to=${to}&limit=10&order=desc`),
                fetch(`/api/reports/top-products?from=${from}&to=${to}&limit=10&order=asc`),
            ])
            setSummary(await sumRes.json())
            setTopProducts(await topRes.json())
            setLowProducts(await lowRes.json())
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [from, to, group])

    const totalRevenue = summary.reduce((s, r) => s + r.total, 0)
    const totalCash = summary.reduce((s, r) => s + (r.cash || 0), 0)
    const totalCard = summary.reduce((s, r) => s + (r.card || 0), 0)
    const totalSales = summary.reduce((s, r) => s + r.sale_count, 0)

    const groupLabels = { day: "Günlük", week: "Haftalık", month: "Aylık", year: "Yıllık" }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Toolbar */}
            <div className="shrink-0 flex flex-wrap items-center gap-3 px-5 py-3 border-b border-zinc-900">
                <div className="flex gap-1">
                    {Object.entries(groupLabels).map(([v, l]) => (
                        <button key={v} onClick={() => setGroup(v)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${group === v ? "bg-blue-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
                                }`}
                        >{l}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                        max={to}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-600 transition-colors" />
                    <span className="text-zinc-600 text-xs">—</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)}
                        min={from} max={today()}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-600 transition-colors" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                {/* Özet kartlar */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: "Toplam Ciro", value: totalRevenue.toLocaleString('tr-TR') + " ₺", color: "text-white" },
                        { label: "Nakit Tahsilat", value: totalCash.toLocaleString('tr-TR') + " ₺", color: "text-emerald-400" },
                        { label: "Kart Tahsilat", value: totalCard.toLocaleString('tr-TR') + " ₺", color: "text-blue-400" },
                        { label: "İşlem Sayısı", value: totalSales, color: "text-purple-400" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color} mt-1`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Dönem tablosu */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        <h3 className="text-sm font-black text-white">{groupLabels[group]} Özet</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                                    <th className="text-left px-5 py-3 font-bold">Dönem</th>
                                    <th className="text-right px-5 py-3 font-bold">İşlem</th>
                                    <th className="text-right px-5 py-3 font-bold">Nakit</th>
                                    <th className="text-right px-5 py-3 font-bold">Kart</th>
                                    <th className="text-right px-5 py-3 font-bold">Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-zinc-600 text-xs">Yükleniyor…</td></tr>
                                ) : summary.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-zinc-600 text-xs">Bu tarih aralığında veri yok</td></tr>
                                ) : summary.map((row, i) => (
                                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-5 py-3 font-bold text-zinc-100">{row.period}</td>
                                        <td className="px-5 py-3 text-right text-zinc-400">{row.sale_count}</td>
                                        <td className="px-5 py-3 text-right text-emerald-400 font-semibold">{(row.cash || 0).toLocaleString('tr-TR')} ₺</td>
                                        <td className="px-5 py-3 text-right text-blue-400 font-semibold">{(row.card || 0).toLocaleString('tr-TR')} ₺</td>
                                        <td className="px-5 py-3 text-right font-black text-white">{row.total.toLocaleString('tr-TR')} ₺</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top/Low ürünler */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[
                        { title: "En Çok Satılan 10 Ürün", data: topProducts, icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, color: "text-emerald-400" },
                        { title: "En Az Satılan 10 Ürün", data: lowProducts, icon: <TrendingDown className="w-4 h-4 text-red-500" />, color: "text-red-400" },
                    ].map(({ title, data, icon, color }) => (
                        <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
                                {icon}
                                <h3 className="text-sm font-black text-white">{title}</h3>
                            </div>
                            <div className="flex flex-col">
                                {data.map((p, i) => (
                                    <div key={i} className="flex items-center gap-3 px-5 py-2.5 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                                        <span className="text-xs font-black text-zinc-600 w-5 shrink-0">{i + 1}</span>
                                        <span className="flex-1 text-xs font-bold text-zinc-200">{p.name}</span>
                                        <span className={`text-xs font-black ${color}`}>{p.qty} adet</span>
                                        <span className="text-xs text-zinc-500 w-20 text-right">{p.revenue.toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                ))}
                                {data.length === 0 && <p className="text-center py-6 text-xs text-zinc-600">Veri yok</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
