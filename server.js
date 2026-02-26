// ═══════════════════════════════════════════════════════════════
//  CAFE ADİSYON — Node.js + SQLite Sunucu  v2
//  Çalıştır: node server.js
//  Frontend: http://localhost:5173  (vite dev)
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ─── VERİTABANI ─────────────────────────────────────────────────
const db = new Database('cafe.db');
db.pragma('journal_mode = WAL');

// ─── TABLOLAR ────────────────────────────────────────────────────
db.exec(`
  -- Kullanıcılar
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    role     TEXT NOT NULL DEFAULT 'personel',
    password TEXT NOT NULL DEFAULT '1',
    perms    TEXT NOT NULL DEFAULT '{}'
  );

  -- Menü ürünleri
  CREATE TABLE IF NOT EXISTS menu (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    cat   TEXT NOT NULL,
    price REAL NOT NULL
  );

  -- Masa kategorileri
  CREATE TABLE IF NOT EXISTS table_categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#3b82f6'
  );

  -- Masalar
  CREATE TABLE IF NOT EXISTS tables_state (
    id          INTEGER PRIMARY KEY,
    orders      TEXT NOT NULL DEFAULT '[]',
    open_time   INTEGER,
    category_id INTEGER REFERENCES table_categories(id)
  );

  -- Satışlar / Ödemeler
  CREATE TABLE IF NOT EXISTS sales (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    date         TEXT NOT NULL,
    ts           INTEGER NOT NULL,
    items        TEXT NOT NULL,
    total        REAL NOT NULL,
    cash_amount  REAL NOT NULL DEFAULT 0,
    card_amount  REAL NOT NULL DEFAULT 0,
    pay_type     TEXT NOT NULL,
    table_id     INTEGER NOT NULL,
    partial      INTEGER NOT NULL DEFAULT 0
  );

  -- Loglar
  CREATE TABLE IF NOT EXISTS logs (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    ts       INTEGER NOT NULL,
    time_str TEXT NOT NULL,
    type     TEXT NOT NULL,
    icon     TEXT,
    descr    TEXT,
    amount   TEXT,
    badge    TEXT
  );

  -- Ayarlar
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Eski sütunları yoksa ekle (migration)
try { db.exec("ALTER TABLE tables_state ADD COLUMN category_id INTEGER REFERENCES table_categories(id)"); } catch { }
try { db.exec("ALTER TABLE sales ADD COLUMN cash_amount REAL NOT NULL DEFAULT 0"); } catch { }
try { db.exec("ALTER TABLE sales ADD COLUMN card_amount REAL NOT NULL DEFAULT 0"); } catch { }

// ─── SEED ────────────────────────────────────────────────────────
function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount === 0) {
    const allPerms = JSON.stringify({ siparis: true, iptal: true, odeme: true, kismi: true, menu_edit: true, rapor: true, log: true, masa_duzen: true, kullanici: true });
    const mudurPerms = JSON.stringify({ siparis: true, iptal: true, odeme: true, kismi: true, menu_edit: true, rapor: true, log: true, masa_duzen: true, kullanici: false });
    const personelPerms = JSON.stringify({ siparis: true, iptal: true, odeme: true, kismi: true, menu_edit: false, rapor: false, log: false, masa_duzen: false, kullanici: false });
    const ins = db.prepare('INSERT INTO users (name,role,password,perms) VALUES (?,?,?,?)');
    ins.run('Yetkili', 'yetkili', '1', allPerms);
    ins.run('Müdür', 'mudur', '1', mudurPerms);
    ins.run('Personel 1', 'personel', '1', personelPerms);
    ins.run('Personel 2', 'personel', '1', personelPerms);
    ins.run('Personel 3', 'personel', '1', personelPerms);
    ins.run('Personel 4', 'personel', '1', personelPerms);
    ins.run('Personel 5', 'personel', '1', personelPerms);
    console.log('✓ Varsayılan kullanıcılar oluşturuldu');
  }

  const menuCount = db.prepare('SELECT COUNT(*) as c FROM menu').get().c;
  if (menuCount === 0) {
    const ins = db.prepare('INSERT INTO menu (name,cat,price) VALUES (?,?,?)');
    [
      ['Türk Kahvesi', 'Sıcak İçecek', 45], ['Espresso', 'Sıcak İçecek', 50],
      ['Cappuccino', 'Sıcak İçecek', 75], ['Latte', 'Sıcak İçecek', 80],
      ['Americano', 'Sıcak İçecek', 65], ['Çay', 'Sıcak İçecek', 30],
      ['Bitki Çayı', 'Sıcak İçecek', 40], ['Soğuk Kahve', 'Soğuk İçecek', 85],
      ['Limonata', 'Soğuk İçecek', 60], ['Meyve Suyu', 'Soğuk İçecek', 50],
      ['Su', 'Soğuk İçecek', 15], ['Soda', 'Soğuk İçecek', 25],
      ['Tost', 'Yiyecek', 80], ['Sandviç', 'Yiyecek', 95],
      ['Kek Dilimi', 'Yiyecek', 70], ['Kurabiye', 'Yiyecek', 40],
      ['Waffle', 'Yiyecek', 120], ['Cheesecake', 'Yiyecek', 110],
      ['Cips', 'Atıştırmalık', 35], ['Fındık Karışık', 'Atıştırmalık', 55],
    ].forEach(i => ins.run(...i));
    console.log('✓ Varsayılan menü oluşturuldu');
  }

  if (!db.prepare("SELECT value FROM settings WHERE key='table_count'").get())
    db.prepare("INSERT INTO settings (key,value) VALUES ('table_count','20')").run();

  if (!db.prepare("SELECT value FROM settings WHERE key='daily_stats'").get())
    db.prepare("INSERT INTO settings (key,value) VALUES ('daily_stats',?)").run(
      JSON.stringify({ total: 0, nakit: 0, kart: 0, lastDate: '' })
    );
}
seedIfEmpty();

// ══════════════ YARDIMCI ════════════════════════════════════════

function addLog(type, icon, descr, amount, badge) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  db.prepare('INSERT INTO logs (ts,time_str,type,icon,descr,amount,badge) VALUES (?,?,?,?,?,?,?)')
    .run(Date.now(), timeStr, type, icon || '', descr || '', amount || '', badge || '');
}

// ══════════════ API ROUTES ═══════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
  if (!u) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
  if (u.password !== password) return res.status(401).json({ error: 'Şifre hatalı' });
  addLog('login', '👤', `${u.name} giriş yaptı`, '', '');
  res.json({ ...u, perms: JSON.parse(u.perms) });
});

// ── Kullanıcılar ─────────────────────────────────────────────────
app.get('/api/users', (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY id').all();
  res.json(rows.map(u => ({ ...u, perms: JSON.parse(u.perms) })));
});

app.post('/api/users', (req, res) => {
  const { name, role, password, perms } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Ad ve şifre zorunlu' });
  const r = db.prepare('INSERT INTO users (name,role,password,perms) VALUES (?,?,?,?)').run(
    name, role || 'personel', password, JSON.stringify(perms || {})
  );
  addLog('user', '👤', `${name} kullanıcısı eklendi`, '', '');
  res.json({ id: r.lastInsertRowid, name, role, password, perms });
});

app.put('/api/users/:id', (req, res) => {
  const { name, password, perms, role } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  db.prepare('UPDATE users SET name=?,password=?,perms=?,role=? WHERE id=?').run(
    name || u.name, password || u.password, JSON.stringify(perms) || u.perms, role || u.role, req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/users/:id', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  if (u) addLog('user', '👤', `${u.name} kullanıcısı silindi`, '', '');
  res.json({ ok: true });
});

// ── Menü ─────────────────────────────────────────────────────────
app.get('/api/menu', (req, res) => {
  res.json(db.prepare('SELECT * FROM menu ORDER BY cat,name').all());
});

app.post('/api/menu', (req, res) => {
  const { name, cat, price } = req.body;
  const r = db.prepare('INSERT INTO menu (name,cat,price) VALUES (?,?,?)').run(name, cat, price);
  addLog('menu', '🍽️', `"${name}" menüye eklendi`, `${price}₺`, '');
  res.json({ id: r.lastInsertRowid, name, cat, price });
});

app.put('/api/menu/:id', (req, res) => {
  const { name, cat, price } = req.body;
  db.prepare('UPDATE menu SET name=?,cat=?,price=? WHERE id=?').run(name, cat, price, req.params.id);
  addLog('menu', '✏️', `"${name}" güncellendi`, `${price}₺`, '');
  res.json({ ok: true });
});

app.delete('/api/menu/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM menu WHERE id=?').get(req.params.id);
  db.prepare('DELETE FROM menu WHERE id=?').run(req.params.id);
  if (item) addLog('menu', '🗑️', `"${item.name}" menüden silindi`, '', '');
  res.json({ ok: true });
});

// ── Masa Kategorileri ─────────────────────────────────────────────
app.get('/api/table-categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM table_categories ORDER BY id').all());
});

app.post('/api/table-categories', (req, res) => {
  const { name, color } = req.body;
  const r = db.prepare('INSERT INTO table_categories (name,color) VALUES (?,?)').run(name, color || '#3b82f6');
  res.json({ id: r.lastInsertRowid, name, color: color || '#3b82f6' });
});

app.put('/api/table-categories/:id', (req, res) => {
  const { name, color } = req.body;
  db.prepare('UPDATE table_categories SET name=?,color=? WHERE id=?').run(name, color, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/table-categories/:id', (req, res) => {
  db.prepare('UPDATE tables_state SET category_id=NULL WHERE category_id=?').run(req.params.id);
  db.prepare('DELETE FROM table_categories WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── Masalar ──────────────────────────────────────────────────────
app.get('/api/tables', (req, res) => {
  const count = parseInt(db.prepare("SELECT value FROM settings WHERE key='table_count'").get().value);
  const rows = db.prepare('SELECT * FROM tables_state').all();
  const map = {};
  rows.forEach(r => {
    map[r.id] = { id: r.id, orders: JSON.parse(r.orders), openTime: r.open_time, categoryId: r.category_id };
  });
  const tables = [];
  for (let i = 1; i <= count; i++) tables.push(map[i] || { id: i, orders: [], openTime: null, categoryId: null });
  res.json(tables);
});

app.put('/api/tables/:id', (req, res) => {
  const { orders, openTime, categoryId } = req.body;
  const id = parseInt(req.params.id);
  const exists = db.prepare('SELECT id FROM tables_state WHERE id=?').get(id);
  if (exists) {
    db.prepare('UPDATE tables_state SET orders=?,open_time=?,category_id=? WHERE id=?').run(
      JSON.stringify(orders), openTime || null, categoryId !== undefined ? categoryId : null, id
    );
  } else {
    db.prepare('INSERT INTO tables_state (id,orders,open_time,category_id) VALUES (?,?,?,?)').run(
      id, JSON.stringify(orders), openTime || null, categoryId !== undefined ? categoryId : null
    );
  }
  res.json({ ok: true });
});

// Toplu kategori güncelleme
app.post('/api/tables/bulk-category', (req, res) => {
  const { tableIds, categoryId } = req.body;
  const upsert = db.prepare(`
    INSERT INTO tables_state (id, orders, category_id) VALUES (?, '[]', ?)
    ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id
  `);
  const tx = db.transaction(() => {
    tableIds.forEach(id => upsert.run(id, categoryId));
  });
  tx();
  res.json({ ok: true });
});

// ── Satışlar ─────────────────────────────────────────────────────
app.get('/api/sales', (req, res) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM sales';
  const args = [];
  if (from || to) {
    sql += ' WHERE 1=1';
    if (from) { sql += ' AND date >= ?'; args.push(from); }
    if (to) { sql += ' AND date <= ?'; args.push(to); }
  }
  sql += ' ORDER BY ts DESC';
  const rows = db.prepare(sql).all(...args);
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items), partial: !!r.partial })));
});

app.post('/api/sales', (req, res) => {
  const { date, ts, items, total, cashAmount, cardAmount, payType, tableId, partial } = req.body;
  const r = db.prepare(`
    INSERT INTO sales (date,ts,items,total,cash_amount,card_amount,pay_type,table_id,partial)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(date, ts, JSON.stringify(items), total, cashAmount || 0, cardAmount || 0, payType, tableId, partial ? 1 : 0);

  addLog('sale', '💰',
    `Masa ${tableId} – ${partial ? 'Kısmi ' : ''}Ödeme (${payType})`,
    `${total}₺`, partial ? 'kısmi' : 'ödeme'
  );
  // daily_stats güncelle
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key='daily_stats'").get();
    const stats = JSON.parse(row.value);
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastDate !== today) { stats.total = 0; stats.nakit = 0; stats.kart = 0; stats.lastDate = today; }
    stats.total += total;
    if (payType === 'nakit') stats.nakit += total;
    else stats.kart += total;
    db.prepare("UPDATE settings SET value=? WHERE key='daily_stats'").run(JSON.stringify(stats));
  } catch { }

  res.json({ id: r.lastInsertRowid });
});

// ── RAPORLAR ─────────────────────────────────────────────────────
// Grup bazlı satış raporu
app.get('/api/reports/summary', (req, res) => {
  const { from, to, group } = req.query; // group: day|week|month|year
  const args = [];
  let where = '1=1';
  if (from) { where += ' AND date >= ?'; args.push(from); }
  if (to) { where += ' AND date <= ?'; args.push(to); }

  let groupExpr;
  if (group === 'day') groupExpr = "date";
  else if (group === 'week') groupExpr = "strftime('%Y-W%W', date)";
  else if (group === 'month') groupExpr = "strftime('%Y-%m', date)";
  else groupExpr = "strftime('%Y', date)"; // year

  const rows = db.prepare(`
    SELECT ${groupExpr} as period,
           COUNT(*) as sale_count,
           COALESCE(SUM(total),0) as total,
           COALESCE(SUM(cash_amount),0) as cash,
           COALESCE(SUM(card_amount),0) as card
    FROM sales WHERE ${where}
    GROUP BY period ORDER BY period DESC
  `).all(...args);
  res.json(rows);
});

// En çok / az satılan ürün raporu
app.get('/api/reports/top-products', (req, res) => {
  const { from, to, limit, order } = req.query; // order: asc|desc

  // 1) Tüm menü ürünlerini başlangıç noktası olarak al (qty:0)
  const allMenu = db.prepare('SELECT name, price FROM menu').all();
  const map = {};
  allMenu.forEach(m => {
    map[m.name] = { name: m.name, qty: 0, revenue: 0 };
  });

  // 2) Satış verilerini üstüne ekle
  const rows = db.prepare('SELECT items FROM sales WHERE 1=1' +
    (from ? ' AND date >= ?' : '') + (to ? ' AND date <= ?' : '')
  ).all(...[from, to].filter(Boolean));

  rows.forEach(row => {
    const items = JSON.parse(row.items);
    items.forEach(it => {
      if (!map[it.name]) map[it.name] = { name: it.name, qty: 0, revenue: 0 };
      map[it.name].qty += parseInt(it.quantity) || 1;
      map[it.name].revenue += (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 1);
    });
  });

  // 3) Sırala ve dilimle
  const sorted = Object.values(map).sort((a, b) =>
    order === 'asc' ? a.qty - b.qty : b.qty - a.qty
  ).slice(0, parseInt(limit) || 10);
  res.json(sorted);
});

// ── Loglar ────────────────────────────────────────────────────────
app.get('/api/logs', (req, res) => {
  const { from, to } = req.query;
  const args = [];
  let where = '1=1';
  if (from) {
    const fromTs = new Date(from).getTime();
    where += ' AND ts >= ?'; args.push(fromTs);
  }
  if (to) {
    const toTs = new Date(to + 'T23:59:59').getTime();
    where += ' AND ts <= ?'; args.push(toTs);
  }
  const rows = db.prepare(`SELECT * FROM logs WHERE ${where} ORDER BY ts DESC LIMIT 1000`).all(...args);
  res.json(rows);
});

app.post('/api/logs', (req, res) => {
  const { ts, time_str, type, icon, descr, amount, badge } = req.body;
  db.prepare('INSERT INTO logs (ts,time_str,type,icon,descr,amount,badge) VALUES (?,?,?,?,?,?,?)')
    .run(ts, time_str, type, icon || '', descr || '', amount || '', badge || '');
  res.json({ ok: true });
});

app.delete('/api/logs', (req, res) => {
  db.prepare('DELETE FROM logs').run();
  res.json({ ok: true });
});

// ── Ayarlar ───────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const obj = {};
  rows.forEach(r => { try { obj[r.key] = JSON.parse(r.value); } catch { obj[r.key] = r.value; } });
  res.json(obj);
});

app.put('/api/settings/:key', (req, res) => {
  const val = typeof req.body.value === 'object'
    ? JSON.stringify(req.body.value)
    : String(req.body.value);
  db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run(req.params.key, val);
  addLog('settings', '⚙️', `Ayar güncellendi: ${req.params.key}`, '', '');
  res.json({ ok: true });
});

// ─── SUNUCU ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   ☕  Cafe Adisyon v2 Çalışıyor        ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║   Backend : http://localhost:${PORT}         ║`);
  console.log('║   Frontend: http://localhost:5173      ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
});
