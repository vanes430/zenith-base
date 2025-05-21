#!/bin/bash

# Cek kalau argumen kosong
if [ -z "$1" ]; then
  echo "Harap masukkan pesan commit. Contoh: bash push.sh \"Update tampilan produk\""
  exit 1
fi

# Git config (opsional, kalau belum diset)
git config --global user.name "vanes430"
git config --global user.email "vanessimbolon2020@gmail.com"  # Ganti dengan email GitHub kamu

# Tambahkan semua perubahan
git add .

# Commit dengan pesan dari argumen
git commit -m "$1"

# Push ke branch main repo kamu
git push https://github.com/vanes430/zenith-base.git main