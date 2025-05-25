# Zenith Base

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/zenith-base)
[![Node.js](https://img.shields.io/badge/Node.js-%3E=20-blue)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

## 📢 Perkenalan

**Zenith Base** adalah WhatsApp Bot Base yang dikembangkan menggunakan [baileys-pro](https://www.npmjs.com/package/@fizzxydev/baileys-pro).  
Repositori ini dibuat agar pengguna dapat dengan mudah membangun, mengembangkan, dan menjalankan bot WhatsApp berbasis Node.js secara efisien.

---

## 🚀 Cara Memulai

### Menggunakan Panel Pterodactyl

1. **Clone** repository ini.
2. **Upload** ke panel Pterodactyl Anda.
3. **Salin** file `.env.example` menjadi `.env`.
4. **Isi** data konfigurasi Anda pada file `.env`.
5. Konfigurasi tambahan tersedia di folder `/src/configs`.
6. Setelah konfigurasi selesai, jalankan perintah berikut:

```bash
# Instalasi dependensi
npm install

# Menjalankan Bot
npm start

# Atau untuk mode pemantauan otomatis
npm run watcher
```

---

### Deploy di VPS / Termux /[VPS Egg Pterodactyl](https://github.com/ysdragon/Pterodactyl-VPS-Egg/blob/main/egg-vps.json)

1. Masuk ke SSH VPS Anda.
2. Jalankan salah satu perintah berikut untuk instalasi otomatis:

```bash
# Pilih salah satu:
wget -qO- https://cdn.zenithcdn.my.id/install.sh | bash

# atau
curl -Lso- https://cdn.zenithcdn.my.id/install.sh | bash
```
**Dukungan Sistem Operasi**

Script otomatis ini mendukung sistem operasi berikut:

| OS      | Versi Dukungan   |
|---------|------------------|
| Ubuntu  | 20 – 24          |
| Debian  | 10 – 12          |
| Termux  | Latest           |

---

## ❓ Bantuan & Dokumentasi

- Untuk pertanyaan teknis, silakan gunakan [Issues]

---

## ⚠️ Lisensi

Repositori ini dilindungi dengan lisensi [MIT](LICENSE).

---

> **Catatan:**  
> Pastikan Node.js versi 20 atau lebih baru untuk kompatibilitas optimal.

---

**Terima kasih telah menggunakan Zenith Base!**
