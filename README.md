# Zenith Base

## Perkenalan
Ini Adalah Bot wa base yang di kembangkan menggunakan [baileys-pro](https://www.npmjs.com/package/@fizzxydev/baileys-pro)
Semoga Kamu menyukai nya

## Cara memulai

### Tutorial Panel Pterodactyl
1. Clone Repository ini
2. Upload Ke Panel Kalian
3. Copy `.env.example` jadi `.env`
4. isi data kalian ke `.env`
5. Konfigurasi lainnya ada di `/src/configs`
6. Setelah Selesi
7. Run Command ini
```
# Install Node Modules
npm install
# Run Script ini
npm start
# atau untuk safety
npm run watcher
```
### Tutorial VPS / Termux
1. Masuk Ke SSH vps kalian
2. Run command ini
```
# Pilih  salah satu
wget -qO- https://cdn.zenithcdn.my.id/install.sh | bash
curl -Lso- https://cdn.zenithcdn.my.id/install.sh | bash
```
saat ini script auto mendukung
| OS      | Versi Dukungan    |
|---------|-------------------|
| Ubuntu  | 20 - 24           |
| Debian  | 10 - 12           |
| Termux  | Latest            |

### Tutorial Di VPS egg Pterodactyl [Click Here](https://github.com/ysdragon/Pterodactyl-VPS-Egg/blob/main/egg-vps.json)
1. Masuk ke panel
2. Pilih Ubuntu kemudian pilih Ubuntu Jammy (22)
3. Run script auto installer tadi
