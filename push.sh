#!/bin/bash

# Cek kalau argumen kosong
if [ $# -eq 0 ]; then
  echo "Harap masukkan pesan commit. Contoh: bash push.sh \"Update tampilan produk\""
  exit 1
fi

# Gabungkan semua argumen sebagai pesan commit (utuh)
commit_message="$*"

# Ambil user.name & user.email dari config lokal repo
username=$(git config user.name)
useremail=$(git config user.email)

# Jika belum ada user.name/email di config lokal, pakai global
if [ -z "$username" ]; then
  username=$(git config --global user.name)
fi
if [ -z "$useremail" ]; then
  useremail=$(git config --global user.email)
fi

# Kalau masih kosong, beri peringatan
if [ -z "$username" ] || [ -z "$useremail" ]; then
  echo "User.name dan user.email belum terkonfigurasi di Git. Silakan set dengan:"
  echo "git config --global user.name \"Nama Anda\""
  echo "git config --global user.email \"email@domain.com\""
  exit 1
fi

# Set config lokal repo jika belum ada (agar commit sesuai user)
git config user.name "$username"
git config user.email "$useremail"

# Cek apakah ada remote default (origin)
remote_name=$(git remote)
if [ -z "$remote_name" ]; then
  echo "Belum ada remote di repo ini. Silakan tambahkan remote terlebih dahulu."
  exit 1
fi

# Gunakan remote pertama (biasanya origin)
remote=$(echo "$remote_name" | head -n 1)

# Cari branch aktif saat ini
branch=$(git branch --show-current)

if [ -z "$branch" ]; then
  echo "Tidak dapat mendeteksi branch aktif. Pastikan Anda sudah berada di dalam repo Git yang valid."
  exit 1
fi

# Tambahkan semua perubahan
git add .

# Cek apakah ada staged changes
if git diff --cached --quiet; then
  echo "Tidak ada perubahan untuk di-commit."
  exit 0
fi

# Commit dengan pesan argumen
git commit -m "$commit_message"

# Push ke remote dan branch aktif
git push "$remote" "$branch"
