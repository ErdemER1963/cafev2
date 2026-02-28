# ☕ Cafe Adisyon Pro v2

Cafe ve restoran işletmeleri için geliştirilmiş, modern ve kullanıcı dostu bir adisyon yönetim sistemi.

---

## 🚀 Özellikler

- **Masa Yönetimi** — Masaları kategorilere ayırma, durum takibi
- **Sipariş Yönetimi** — Hızlı sipariş alma, iptal ve güncelleme
- **Ödeme Sistemi** — Nakit / kart ile tam veya kısmi ödeme
- **Menü Yönetimi** — Ürün ekleme, düzenleme, kategorilere ayırma
- **Raporlar** — Günlük, haftalık, aylık satış raporları; en çok satılan ürünler
- **Kullanıcı & Yetki Yönetimi** — Yetkili, müdür ve personel rolleri
- **Log Sistemi** — Tüm işlemlerin detaylı kaydı
- **PWA Desteği** — Telefona uygulama gibi yüklenebilir (iOS & Android)

---

## 🛠️ Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express v5 |
| Veritabanı | PostgreSQL (Neon) |
| Deploy | Railway |

---

## 📦 Kurulum (Yerel Geliştirme)

### Gereksinimler
- Node.js v18+
- PostgreSQL veya [Neon](https://neon.tech) hesabı

### Adımlar

```bash
# Repoyu klonla
git clone https://github.com/KULLANICI_ADIN/REPO_ADIN.git
cd cafe

# Bağımlılıkları yükle
npm install
cd frontend && npm install && cd ..

# .env dosyasını oluştur
cp .env.example .env
# DATABASE_URL değerini doldur

# Geliştirme modunda çalıştır
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır.

---

## ⚙️ Ortam Değişkenleri

`.env` dosyasında aşağıdaki değişken tanımlanmalıdır:

```env
DATABASE_URL=postgresql://kullanici:sifre@host/veritabani?sslmode=require
```

---

## 🌐 Canlıya Alma (Railway)

1. [railway.app](https://railway.app) üzerinde GitHub reposunu bağla
2. **Variables** sekmesine `DATABASE_URL` değerini ekle
3. Railway otomatik olarak build alır ve yayına alır

---

## 👤 Varsayılan Kullanıcılar

İlk çalıştırmada aşağıdaki kullanıcılar otomatik oluşturulur:

| Kullanıcı | Rol | Şifre |
|-----------|-----|-------|
| Yetkili | yetkili | 1 |
| Müdür | mudur | 1 |
| Personel 1-5 | personel | 1 |

> ⚠️ Canlı ortamda şifreleri değiştirmeyi unutmayın.

---

## 📱 PWA Kurulumu (Telefon)

1. Telefon tarayıcısında Railway URL'ini aç
2. **"Ana ekrana ekle"** seçeneğine bas
3. Uygulama simgesi olarak telefona yüklenir

---

## 📁 Proje Yapısı

```
cafe/
├── server.js          # Express API sunucusu
├── package.json
├── .env               # Ortam değişkenleri (git'e ekleme!)
└── frontend/
    ├── src/           # React bileşenleri
    ├── public/        # Statik dosyalar (ikon, manifest)
    └── index.html
```

---

## 📄 Lisans

MIT
