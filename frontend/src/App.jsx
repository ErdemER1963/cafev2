import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "./components/Sidebar"
import { TableCard } from "./components/TableCard"
import { OrderState } from "./components/OrderState"
import CheckoutModal from "./components/CheckoutModal"
import OrderModal from "./components/OrderModal"
import TableCategoryManager from "./components/TableCategoryManager"
import LoginPage from "./pages/LoginPage"
import MenuPage from "./pages/MenuPage"
import ReportsPage from "./pages/ReportsPage"
import LogsPage from "./pages/LogsPage"
import UsersPage from "./pages/UsersPage"
import SettingsPage from "./pages/SettingsPage"
import { useAuth } from "./context/AuthContext"
import { Coffee, Plus, Receipt } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "./lib/utils"

const DATE_OPT = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
const SIDEBAR_PX = 72

export default function App() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("tables")
  const [tables, setTables] = useState([])
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [activeTableCat, setActiveTableCat] = useState("tumu")
  const [loading, setLoading] = useState(true)
  const [orderTable, setOrderTable] = useState(null)   // OrderModal için
  const [checkoutTable, setCheckoutTable] = useState(null)   // CheckoutModal için
  const [showCatManager, setShowCatManager] = useState(false)

  // ─── Data load ───────────────────────────────────────────────────
  const loadTables = useCallback(async () => {
    const [tabRes, catRes] = await Promise.all([
      fetch('/api/tables'),
      fetch('/api/table-categories'),
    ])
    const tabData = await tabRes.json()
    const catData = await catRes.json()
    setCategories(catData)
    setTables(tabData.map(t => ({
      ...t,
      status: t.orders.length > 0 ? "occupied" : "empty",
      total: t.orders.reduce((s, o) => s + (parseFloat(o.price) || 0) * (parseInt(o.quantity) || 1), 0),
      time: t.openTime
        ? new Date(t.openTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + "'dan beri"
        : "",
    })))
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const [menuRes] = await Promise.all([
          fetch('/api/menu'),
          loadTables(),
        ])
        setMenu(await menuRes.json())
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    init()
  }, [])

  // ─── Helpers ─────────────────────────────────────────────────────
  const saveTable = async (id, orders, openTime, categoryId) => {
    await fetch(`/api/tables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders, openTime, categoryId }),
    })
  }

  // State'i güncelle — orderTable'ı da eşitle
  const updateState = (id, orders, openTime) => {
    const total = orders.reduce((s, o) => s + (parseFloat(o.price) || 0) * (parseInt(o.quantity) || 1), 0)
    const status = orders.length > 0 ? "occupied" : "empty"
    setTables(prev => prev.map(t => t.id === id ? { ...t, orders, total, status, openTime } : t))
    setOrderTable(prev => prev?.id === id ? { ...prev, orders, total, status, openTime } : prev)
  }

  // ─── Order Handlers ──────────────────────────────────────────────
  const getTable = (id) => tables.find(t => t.id === id)

  const handleAddItem = async (product) => {
    if (!orderTable) return
    const current = getTable(orderTable.id) || orderTable
    const existing = current.orders.find(o => o.id === product.id)
    const newOrders = existing
      ? current.orders.map(o => o.id === product.id ? { ...o, quantity: (o.quantity || 1) + 1 } : o)
      : [...current.orders, { ...product, quantity: 1 }]
    const openTime = current.openTime || Date.now()
    await saveTable(current.id, newOrders, openTime, current.categoryId)
    updateState(current.id, newOrders, openTime)
  }

  const handleUpdateQty = async (pid, qty) => {
    if (!orderTable || qty < 1) return
    const current = getTable(orderTable.id) || orderTable
    const newOrders = current.orders.map(o => o.id === pid ? { ...o, quantity: qty } : o)
    await saveTable(current.id, newOrders, current.openTime, current.categoryId)
    updateState(current.id, newOrders, current.openTime)
  }

  const handleRemoveItem = async (pid) => {
    if (!orderTable) return
    const current = getTable(orderTable.id) || orderTable
    const newOrders = current.orders.filter(o => o.id !== pid)
    const openTime = newOrders.length === 0 ? null : current.openTime
    await saveTable(current.id, newOrders, openTime, current.categoryId)
    updateState(current.id, newOrders, openTime)
  }

  // orderTable içinden checkout'a geç
  const openCheckout = () => {
    const current = getTable(orderTable.id) || orderTable
    if (current.orders.length === 0) return
    setCheckoutTable(current)
  }

  // Ödeme tamamlandı
  const handleCheckoutConfirm = async (saleData) => {
    const { items, total, cashAmount, cardAmount, payType, partial, tableId } = saleData
    await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        ts: Date.now(),
        items, total, cashAmount, cardAmount, payType,
        tableId, partial: partial ? 1 : 0,
      }),
    })
    const current = getTable(tableId)
    if (!partial) {
      await saveTable(tableId, [], null, current?.categoryId)
      updateState(tableId, [], null)
      setOrderTable(null)
    } else {
      const paidIds = items.map(i => i.id)
      const remaining = (current?.orders || []).filter(o => !paidIds.includes(o.id))
      const openTime = remaining.length > 0 ? current?.openTime : null
      await saveTable(tableId, remaining, openTime, current?.categoryId)
      updateState(tableId, remaining, openTime)
      if (remaining.length === 0) setOrderTable(null)
    }
    setCheckoutTable(null)
  }

  const handleBulkCategory = async (tableIds, categoryId) => {
    await fetch('/api/tables/bulk-category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableIds, categoryId }),
    })
    await loadTables()
  }

  // ─── Loading / Login ─────────────────────────────────────────────
  if (!user) return <LoginPage />

  if (loading) return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
        <Coffee className="w-6 h-6 text-white" />
      </div>
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const dateStr = new Date().toLocaleDateString('tr-TR', DATE_OPT)
  const occupied = tables.filter(t => t.status === "occupied").length
  const visibleTables = activeTableCat === "tumu"
    ? tables
    : tables.filter(t => t.categoryId === parseInt(activeTableCat))

  const TAB_LABELS = {
    tables: "Masa Yönetimi",
    menu: "Menü Yönetimi",
    reports: "Raporlar",
    logs: "Loglar",
    users: "Kullanıcılar",
    settings: "Masa Düzenle",
    system: "Ayarlar",
  }

  // tables state'indeki güncel tabloya göre orderTable'ı yansıt
  const liveOrderTable = orderTable ? (tables.find(t => t.id === orderTable.id) || orderTable) : null

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-inter">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden" style={{ paddingLeft: SIDEBAR_PX }}>
        {/* Header */}
        <header className="shrink-0 h-14 flex items-center justify-between px-5 border-b border-zinc-900 bg-zinc-950/95 backdrop-blur-md z-20">
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase text-white leading-none">
              {TAB_LABELS[activeTab] || activeTab}
            </h1>
            <p className="text-[9px] text-zinc-600 font-medium capitalize mt-0.5">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 mr-1">
              <div className="text-right">
                <p className="text-[9px] text-zinc-600 uppercase font-bold">Dolu</p>
                <p className="text-xs font-black text-white">{occupied}/{tables.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-900/30 border border-emerald-800/50">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Çevrimiçi</span>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── MASALAR ── */}
            {activeTab === "tables" && (
              <motion.div key="tables" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-hidden">
                {/* Kategori sekmeleri */}
                <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 border-b border-zinc-900 overflow-x-auto scrollbar-none">
                  <button onClick={() => setActiveTableCat("tumu")}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                      activeTableCat === "tumu" ? "bg-blue-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
                    )}>
                    Tümü ({tables.length})
                  </button>
                  {categories.map(cat => {
                    const count = tables.filter(t => t.categoryId === cat.id).length
                    return (
                      <button key={cat.id} onClick={() => setActiveTableCat(String(cat.id))}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                          activeTableCat === String(cat.id) ? "bg-blue-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
                        )}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        {cat.name} ({count})
                      </button>
                    )
                  })}
                </div>
                {/* Masa ızgarası */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                    {visibleTables.map(table => (
                      <TableCard
                        key={table.id}
                        {...table}
                        category={categories.find(c => c.id === table.categoryId)}
                        active={orderTable?.id === table.id}
                        onClick={() => setOrderTable(table)}
                      />
                    ))}
                    {visibleTables.length === 0 && (
                      <div className="col-span-full text-center py-16 text-zinc-600">
                        <p className="text-sm">Bu kategoride masa yok</p>
                        <p className="text-xs mt-1">Masa kategorilendirmek için "Masa Düzenle" sekmesine gidin.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── MENÜ ── */}
            {activeTab === "menu" && (
              <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-hidden">
                <MenuPage />
              </motion.div>
            )}

            {/* ── RAPORLAR ── */}
            {activeTab === "reports" && (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-hidden">
                <ReportsPage />
              </motion.div>
            )}

            {/* ── LOGLAR ── */}
            {activeTab === "logs" && (
              <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-hidden">
                <LogsPage />
              </motion.div>
            )}

            {/* ── KULLANICILAR ── */}
            {activeTab === "users" && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-hidden">
                <UsersPage />
              </motion.div>
            )}

            {/* ── MASA DÜZENLE ── */}
            {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-hidden">
                <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-zinc-900">
                  <button onClick={() => setShowCatManager(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all">
                    Masaları Kategorilere Ata
                  </button>
                </div>
                <SettingsPage onTableCountChange={loadTables} />
              </motion.div>
            )}

            {/* ── AYARLAR (boş) ── */}
            {activeTab === "system" && (
              <motion.div key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full items-center justify-center">
                <div className="text-zinc-700 flex flex-col items-center gap-3">
                  <Coffee className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-bold">Ayarlar yakında eklenecek</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Modaller ── */}

      {/* Sipariş Modalı — masaya tıklayınca açılır */}
      <AnimatePresence>
        {orderTable && !checkoutTable && (
          <OrderModal
            table={liveOrderTable}
            menu={menu}
            onClose={() => setOrderTable(null)}
            onAddItem={handleAddItem}
            onUpdateQty={handleUpdateQty}
            onRemove={handleRemoveItem}
            onCheckout={openCheckout}
          />
        )}
      </AnimatePresence>

      {/* Ödeme Modalı */}
      {checkoutTable && (
        <CheckoutModal
          table={checkoutTable}
          onClose={() => setCheckoutTable(null)}
          onConfirm={handleCheckoutConfirm}
        />
      )}

      {/* Kategori Yöneticisi */}
      {showCatManager && (
        <TableCategoryManager
          tables={tables}
          categories={categories}
          onConfirm={handleBulkCategory}
          onClose={() => setShowCatManager(false)}
        />
      )}
    </div>
  )
}
