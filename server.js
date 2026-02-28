// ═══════════════════════════════════════════════════════════════
//  CAFE ADİSYON — Node.js + PostgreSQL Sunucu  v2
//  Çalıştır: npm run dev
//  Frontend: http://localhost:5173  (vite dev)
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// ─── VERİTABANI ─────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  await pool.query(`
    -- Kullanıcılar
    CREATE TABLE IF NOT EXISTS users (
      id       SERIAL PRIMARY KEY,
      name     VARCHAR(255) NOT NULL,
      role     VARCHAR(50) NOT NULL DEFAULT 'personel',
      password VARCHAR(255) NOT NULL DEFAULT '1',
      perms    TEXT NOT NULL DEFAULT '{}'
    );

    -- Menü ürünleri
    CREATE TABLE IF NOT EXISTS menu (
      id    SERIAL PRIMARY KEY,
      name  VARCHAR(255) NOT NULL,
      cat   VARCHAR(255) NOT NULL,
      price REAL NOT NULL
    );

    -- Masa kategorileri
    CREATE TABLE IF NOT EXISTS table_categories (
      id    SERIAL PRIMARY KEY,
      name  VARCHAR(255) NOT NULL UNIQUE,
      color VARCHAR(50) NOT NULL DEFAULT '#3b82f6'
    );

    -- Masalar
    CREATE TABLE IF NOT EXISTS tables_state (
      id          INTEGER PRIMARY KEY,
      orders      TEXT NOT NULL DEFAULT '[]',
      open_time   BIGINT,
      category_id INTEGER REFERENCES table_categories(id)
    );

    -- Satışlar / Ödemeler
    CREATE TABLE IF NOT EXISTS sales (
      id           SERIAL PRIMARY KEY,
      date         VARCHAR(50) NOT NULL,
      ts           BIGINT NOT NULL,
      items        TEXT NOT NULL,
      total        REAL NOT NULL,
      cash_amount  REAL NOT NULL DEFAULT 0,
      card_amount  REAL NOT NULL DEFAULT 0,
      pay_type     VARCHAR(50) NOT NULL,
      table_id     INTEGER NOT NULL,
      partial      INTEGER NOT NULL DEFAULT 0
    );

    -- Loglar
    CREATE TABLE IF NOT EXISTS logs (
      id       SERIAL PRIMARY KEY,
      ts       BIGINT NOT NULL,
      time_str VARCHAR(50) NOT NULL,
      type     VARCHAR(50) NOT NULL,
      icon     VARCHAR(50),
      descr    TEXT,
      amount   VARCHAR(50),
      badge    VARCHAR(50)
    );

    -- Ayarlar
    CREATE TABLE IF NOT EXISTS settings (
      key   VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Eski sütunları yoksa ekle (migration)
  try { await pool.query("ALTER TABLE tables_state ADD COLUMN category_id INTEGER REFERENCES table_categories(id)"); } catch (e) { }
  try { await pool.query("ALTER TABLE sales ADD COLUMN cash_amount REAL NOT NULL DEFAULT 0"); } catch (e) { }
  try { await pool.query("ALTER TABLE sales ADD COLUMN card_amount REAL NOT NULL DEFAULT 0"); } catch (e) { }

  await seedIfEmpty();
}

initDB().catch(console.error);

// ─── SEED ────────────────────────────────────────────────────────
async function seedIfEmpty() {
  const userCountRes = await pool.query('SELECT COUNT(*) as c FROM users');
  const userCount = parseInt(userCountRes.rows[0].c);
  if (userCount === 0) {
    const allPerms = JSON.stringify({ siparis: true, iptal: true, odeme: true, kismi: true, menu_edit: true, rapor: true, log: true, masa_duzen: true, kullanici: true });
    const mudurPerms = JSON.stringify({ siparis: true, iptal: true, odeme: true, kismi: true, menu_edit: true, rapor: true, log: true, masa_duzen: true, kullanici: false });
    const personelPerms = JSON.stringify({ siparis: true, iptal: true, odeme: true, kismi: true, menu_edit: false, rapor: false, log: false, masa_duzen: false, kullanici: false });

    const users = [
      ['Yetkili', 'yetkili', '1', allPerms],
      ['Müdür', 'mudur', '1', mudurPerms],
      ['Personel 1', 'personel', '1', personelPerms],
      ['Personel 2', 'personel', '1', personelPerms],
      ['Personel 3', 'personel', '1', personelPerms],
      ['Personel 4', 'personel', '1', personelPerms],
      ['Personel 5', 'personel', '1', personelPerms],
    ];

    for (const u of users) {
      await pool.query('INSERT INTO users (name,role,password,perms) VALUES ($1,$2,$3,$4)', u);
    }
    console.log('✓ Varsayılan kullanıcılar oluşturuldu');
  }

  const menuCountRes = await pool.query('SELECT COUNT(*) as c FROM menu');
  const menuCount = parseInt(menuCountRes.rows[0].c);
  if (menuCount === 0) {
    const menuItems = [
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
    ];
    for (const item of menuItems) {
      await pool.query('INSERT INTO menu (name,cat,price) VALUES ($1,$2,$3)', item);
    }
    console.log('✓ Varsayılan menü oluşturuldu');
  }

  const tableCntRes = await pool.query("SELECT value FROM settings WHERE key='table_count'");
  if (tableCntRes.rows.length === 0) {
    await pool.query("INSERT INTO settings (key,value) VALUES ('table_count','20')");
  }

  const dailyStatsRes = await pool.query("SELECT value FROM settings WHERE key='daily_stats'");
  if (dailyStatsRes.rows.length === 0) {
    await pool.query("INSERT INTO settings (key,value) VALUES ('daily_stats',$1)", [
      JSON.stringify({ total: 0, nakit: 0, kart: 0, lastDate: '' })
    ]);
  }
}

// ══════════════ YARDIMCI ════════════════════════════════════════

async function addLog(type, icon, descr, amount, badge) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  await pool.query('INSERT INTO logs (ts,time_str,type,icon,descr,amount,badge) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [Date.now(), timeStr, type, icon || '', descr || '', amount || '', badge || '']
  );
}

// ══════════════ API ROUTES ═══════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
    const u = rows[0];
    if (!u) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    if (u.password !== password) return res.status(401).json({ error: 'Şifre hatalı' });
    await addLog('login', '👤', `${u.name} giriş yaptı`, '', '');
    res.json({ ...u, perms: JSON.parse(u.perms) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Kullanıcılar ─────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
    res.json(rows.map(u => ({ ...u, perms: JSON.parse(u.perms) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, role, password, perms } = req.body;
    if (!name || !password) return res.status(400).json({ error: 'Ad ve şifre zorunlu' });
    const { rows } = await pool.query(
      'INSERT INTO users (name,role,password,perms) VALUES ($1,$2,$3,$4) RETURNING id',
      [name, role || 'personel', password, JSON.stringify(perms || {})]
    );
    await addLog('user', '👤', `${name} kullanıcısı eklendi`, '', '');
    res.json({ id: rows[0].id, name, role, password, perms });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, password, perms, role } = req.body;
    const { rows: uRows } = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
    const u = uRows[0];
    if (!u) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    await pool.query(
      'UPDATE users SET name=$1,password=$2,perms=$3,role=$4 WHERE id=$5',
      [name || u.name, password || u.password, JSON.stringify(perms) || u.perms, role || u.role, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
    const u = rows[0];
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    if (u) await addLog('user', '👤', `${u.name} kullanıcısı silindi`, '', '');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Menü ─────────────────────────────────────────────────────────
app.get('/api/menu', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM menu ORDER BY cat,name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/menu', async (req, res) => {
  try {
    const { name, cat, price } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO menu (name,cat,price) VALUES ($1,$2,$3) RETURNING id',
      [name, cat, price]
    );
    await addLog('menu', '🍽️', `"${name}" menüye eklendi`, `${price}₺`, '');
    res.json({ id: rows[0].id, name, cat, price });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const { name, cat, price } = req.body;
    await pool.query('UPDATE menu SET name=$1,cat=$2,price=$3 WHERE id=$4', [name, cat, price, req.params.id]);
    await addLog('menu', '✏️', `"${name}" güncellendi`, `${price}₺`, '');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM menu WHERE id=$1', [req.params.id]);
    const item = rows[0];
    await pool.query('DELETE FROM menu WHERE id=$1', [req.params.id]);
    if (item) await addLog('menu', '🗑️', `"${item.name}" menüden silindi`, '', '');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Masa Kategorileri ─────────────────────────────────────────────
app.get('/api/table-categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM table_categories ORDER BY id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/table-categories', async (req, res) => {
  try {
    const { name, color } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO table_categories (name,color) VALUES ($1,$2) RETURNING id',
      [name, color || '#3b82f6']
    );
    res.json({ id: rows[0].id, name, color: color || '#3b82f6' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/table-categories/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    await pool.query('UPDATE table_categories SET name=$1,color=$2 WHERE id=$3', [name, color, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/table-categories/:id', async (req, res) => {
  try {
    await pool.query('UPDATE tables_state SET category_id=NULL WHERE category_id=$1', [req.params.id]);
    await pool.query('DELETE FROM table_categories WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Masalar ──────────────────────────────────────────────────────
app.get('/api/tables', async (req, res) => {
  try {
    const { rows: setRows } = await pool.query("SELECT value FROM settings WHERE key='table_count'");
    const count = parseInt(setRows[0]?.value || '20');

    const { rows } = await pool.query('SELECT * FROM tables_state');
    const map = {};
    rows.forEach(r => {
      map[r.id] = { id: r.id, orders: JSON.parse(r.orders), openTime: r.open_time ? parseInt(r.open_time) : null, categoryId: r.category_id };
    });

    const tables = [];
    for (let i = 1; i <= count; i++) {
      tables.push(map[i] || { id: i, orders: [], openTime: null, categoryId: null });
    }
    res.json(tables);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/tables/:id', async (req, res) => {
  try {
    const { orders, openTime, categoryId } = req.body;
    const id = parseInt(req.params.id);
    const { rows: exists } = await pool.query('SELECT id FROM tables_state WHERE id=$1', [id]);

    if (exists.length > 0) {
      await pool.query(
        'UPDATE tables_state SET orders=$1,open_time=$2,category_id=$3 WHERE id=$4',
        [JSON.stringify(orders), openTime || null, categoryId !== undefined ? categoryId : null, id]
      );
    } else {
      await pool.query(
        'INSERT INTO tables_state (id,orders,open_time,category_id) VALUES ($1,$2,$3,$4)',
        [id, JSON.stringify(orders), openTime || null, categoryId !== undefined ? categoryId : null]
      );
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tables/bulk-category', async (req, res) => {
  try {
    const { tableIds, categoryId } = req.body;

    // PostgreSQL UPSERT implementation
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const id of tableIds) {
        await client.query(`
            INSERT INTO tables_state (id, orders, category_id) VALUES ($1, '[]', $2)
            ON CONFLICT(id) DO UPDATE SET category_id=EXCLUDED.category_id
          `, [id, categoryId]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Satışlar ─────────────────────────────────────────────────────
app.get('/api/sales', async (req, res) => {
  try {
    const { from, to } = req.query;
    let sql = 'SELECT * FROM sales WHERE 1=1';
    const args = [];
    let idx = 1;

    if (from) { sql += ` AND date >= $${idx++}`; args.push(from); }
    if (to) { sql += ` AND date <= $${idx++}`; args.push(to); }
    sql += ' ORDER BY ts DESC';

    const { rows } = await pool.query(sql, args);
    res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items), partial: !!r.partial, ts: parseInt(r.ts) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { date, ts, items, total, cashAmount, cardAmount, payType, tableId, partial } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO sales (date,ts,items,total,cash_amount,card_amount,pay_type,table_id,partial)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
    `, [date, ts, JSON.stringify(items), total, cashAmount || 0, cardAmount || 0, payType, tableId, partial ? 1 : 0]);

    await addLog('sale', '💰',
      `Masa ${tableId} – ${partial ? 'Kısmi ' : ''}Ödeme (${payType})`,
      `${total}₺`, partial ? 'kısmi' : 'ödeme'
    );

    // daily_stats güncelle
    try {
      const { rows: setRows } = await pool.query("SELECT value FROM settings WHERE key='daily_stats'");
      if (setRows.length > 0) {
        const stats = JSON.parse(setRows[0].value);
        const today = new Date().toISOString().split('T')[0];
        if (stats.lastDate !== today) { stats.total = 0; stats.nakit = 0; stats.kart = 0; stats.lastDate = today; }
        stats.total += total;
        if (payType === 'nakit') stats.nakit += total;
        else stats.kart += total;
        await pool.query("UPDATE settings SET value=$1 WHERE key='daily_stats'", [JSON.stringify(stats)]);
      }
    } catch (e) { console.error(e) }

    res.json({ id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RAPORLAR ─────────────────────────────────────────────────────
app.get('/api/reports/summary', async (req, res) => {
  try {
    const { from, to, group } = req.query;
    const args = [];
    let where = '1=1';
    let idx = 1;

    if (from) { where += ` AND date >= $${idx++}`; args.push(from); }
    if (to) { where += ` AND date <= $${idx++}`; args.push(to); }

    // Postgres date grouping
    let groupExpr;
    if (group === 'day') groupExpr = "date";
    else if (group === 'week') groupExpr = "to_char(to_date(date, 'YYYY-MM-DD'), 'IYYY-IW')";
    else if (group === 'month') groupExpr = "substring(date from 1 for 7)";
    else groupExpr = "substring(date from 1 for 4)"; // year

    const sql = `
      SELECT ${groupExpr} as period,
             COUNT(*) as sale_count,
             COALESCE(SUM(total),0) as total,
             COALESCE(SUM(cash_amount),0) as cash,
             COALESCE(SUM(card_amount),0) as card
      FROM sales WHERE ${where}
      GROUP BY ${groupExpr} ORDER BY period DESC
    `;

    const { rows } = await pool.query(sql, args);
    // Parse sums which pg returns as strings sometimes
    res.json(rows.map(r => ({
      ...r,
      sale_count: parseInt(r.sale_count),
      total: parseFloat(r.total),
      cash: parseFloat(r.cash),
      card: parseFloat(r.card)
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/top-products', async (req, res) => {
  try {
    const { from, to, limit, order } = req.query;

    const { rows: allMenu } = await pool.query('SELECT name, price FROM menu');
    const map = {};
    allMenu.forEach(m => {
      map[m.name] = { name: m.name, qty: 0, revenue: 0 };
    });

    const args = [];
    let sql = 'SELECT items FROM sales WHERE 1=1';
    let idx = 1;
    if (from) { sql += ` AND date >= $${idx++}`; args.push(from); }
    if (to) { sql += ` AND date <= $${idx++}`; args.push(to); }

    const { rows } = await pool.query(sql, args);

    rows.forEach(row => {
      const items = JSON.parse(row.items);
      items.forEach(it => {
        if (!map[it.name]) map[it.name] = { name: it.name, qty: 0, revenue: 0 };
        map[it.name].qty += parseInt(it.quantity) || 1;
        map[it.name].revenue += (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 1);
      });
    });

    const sorted = Object.values(map).sort((a, b) =>
      order === 'asc' ? a.qty - b.qty : b.qty - a.qty
    ).slice(0, parseInt(limit) || 10);

    res.json(sorted);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Loglar ────────────────────────────────────────────────────────
app.get('/api/logs', async (req, res) => {
  try {
    const { from, to } = req.query;
    const args = [];
    let where = '1=1';
    let idx = 1;

    if (from) {
      where += ` AND ts >= $${idx++}`; args.push(new Date(from).getTime());
    }
    if (to) {
      where += ` AND ts <= $${idx++}`; args.push(new Date(to + 'T23:59:59').getTime());
    }

    const { rows } = await pool.query(`SELECT * FROM logs WHERE ${where} ORDER BY ts DESC LIMIT 1000`, args);
    res.json(rows.map(r => ({ ...r, ts: parseInt(r.ts) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/logs', async (req, res) => {
  try {
    const { ts, time_str, type, icon, descr, amount, badge } = req.body;
    await pool.query(
      'INSERT INTO logs (ts,time_str,type,icon,descr,amount,badge) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [ts, time_str, type, icon || '', descr || '', amount || '', badge || '']
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/logs', async (req, res) => {
  try {
    await pool.query('DELETE FROM logs');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Ayarlar ───────────────────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM settings');
    const obj = {};
    rows.forEach(r => { try { obj[r.key] = JSON.parse(r.value); } catch { obj[r.key] = r.value; } });
    res.json(obj);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/settings/:key', async (req, res) => {
  try {
    const val = typeof req.body.value === 'object'
      ? JSON.stringify(req.body.value)
      : String(req.body.value);

    await pool.query(`
      INSERT INTO settings (key,value) VALUES ($1,$2)
      ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value
    `, [req.params.key, val]);

    await addLog('settings', '⚙️', `Ayar güncellendi: ${req.params.key}`, '', '');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── FRONTEND CATCH-ALL ───────────────────────────────────────────
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
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
