#!/bin/bash

set -e

print_header() {
cat <<"EOF"

███████╗███████╗███╗   ██╗██╗████████╗██╗  ██╗
╚══███╔╝██╔════╝████╗  ██║██║╚══██╔══╝██║  ██║
  ███╔╝ █████╗  ██╔██╗ ██║██║   ██║   ███████║
 ███╔╝  ██╔══╝  ██║╚██╗██║██║   ██║   ██╔══██║
███████╗███████╗██║ ╚████║██║   ██║   ██║  ██║
╚══════╝╚══════╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚═╝  ╚═╝
                                              
+---------------------------------------------+
|           AUTO SCRIPT INSTALLER             |
|   GitHub: https://github.com/vanes430       |
+---------------------------------------------+
EOF
}

# ===== CONFIG =====
GITHUB_REPO="https://github.com/vanes430/zenith-base.git"  # Ganti sesuai repo kamu
BRANCH="main"
INSTALL_DIR="$HOME/bot-nodejs"
MIN_NODE_VERSION=20
MIN_UBUNTU_VERSION=20
MIN_DEBIAN_VERSION=10

# ===== Fungsi cek versi Node.js =====
get_node_major_version() {
  node -v 2>/dev/null | grep -oP '(?<=v)\d+' || echo "0"
}

# ===== Spinner progress =====
spinner() {
  local pid=$1
  local delay=0.1
  local spinstr='|/-\'
  while kill -0 "$pid" 2>/dev/null; do
    local temp=${spinstr#?}
    printf " [%c]  " "$spinstr"
    spinstr=$temp${spinstr%"$temp"}
    sleep $delay
    printf "\b\b\b\b\b\b"
  done
  printf "    \b\b\b\b"
}

# ===== Validasi nomor bot =====
validate_number() {
  local number="$1"
  if [[ "$number" =~ ^[0-9]{8,15}$ ]]; then
    return 0
  else
    return 1
  fi
}

# ===== Deteksi OS, versi, dan package manager =====
detect_os_and_pkgmgr() {
  OS=""
  PKG_MGR=""
  OS_VERSION=""

  if [[ "$PREFIX" == *"com.termux"* ]]; then
    OS="Termux"
    PKG_MGR="pkg"
    OS_VERSION="Termux"
  else
    unameOut="$(uname -s)"
    case "${unameOut}" in
      Linux*)
        if [ -f /etc/os-release ]; then
          . /etc/os-release
          OS=$ID
          OS_VERSION=$VERSION_ID
          if [[ "$OS" == "ubuntu" ]]; then
            PKG_MGR="apt"
          elif [[ "$OS" == "debian" ]]; then
            PKG_MGR="apt"
          else
            OS="OtherLinux"
            PKG_MGR=""
          fi
        else
          OS="UnknownLinux"
          PKG_MGR=""
        fi
        ;;
      *)
        OS="Unsupported"
        ;;
    esac
  fi
  echo "$OS|$OS_VERSION|$PKG_MGR"
}

# ===== MULAI SCRIPT =====

print_header
echo

# Input nomor bot dengan read diarahkan ke /dev/tty supaya bisa jalan interaktif via pipe
while true; do
  read -p "Masukkan nomor bot (8-15 digit, hanya angka): " USER_NUMBER </dev/tty
  if validate_number "$USER_NUMBER"; then
    echo "Nomor valid: $USER_NUMBER"
    break
  else
    echo "Nomor tidak valid. Pastikan hanya angka dan panjang 8-15 digit. Coba lagi."
  fi
done

read -p "Mulai proses instalasi? (Y/n): " CONFIRM </dev/tty
CONFIRM=${CONFIRM:-Y}

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Instalasi dibatalkan."
  exit 1
fi

read -r OS OS_VERSION PKG_MGR <<< "$(detect_os_and_pkgmgr | tr '|' ' ')"

if [[ "$OS" == "ubuntu" ]]; then
  ver_major=${OS_VERSION%%.*}
  if (( ver_major < MIN_UBUNTU_VERSION )); then
    echo "Versi Ubuntu kamu $OS_VERSION tidak didukung. Minimal Ubuntu $MIN_UBUNTU_VERSION."
    exit 1
  fi
elif [[ "$OS" == "debian" ]]; then
  ver_major=${OS_VERSION%%.*}
  if (( ver_major < MIN_DEBIAN_VERSION )); then
    echo "Versi Debian kamu $OS_VERSION tidak didukung. Minimal Debian $MIN_DEBIAN_VERSION."
    exit 1
  fi
elif [[ "$OS" == "Termux" ]]; then
  :
else
  echo "Maaf, OS kamu ($OS) belum support script auto install ini."
  echo "Script hanya support Termux, Debian >=$MIN_DEBIAN_VERSION, dan Ubuntu >=$MIN_UBUNTU_VERSION."
  exit 1
fi

echo "[INFO] OS terdeteksi: $OS $OS_VERSION"
echo "[INFO] Package manager: $PKG_MGR"

echo "[1] Update package list dan install tools pendukung..."
if [[ "$PKG_MGR" == "apt" ]]; then
  sudo apt update -y
  sudo apt install -y git curl build-essential python3 python3-pip
elif [[ "$PKG_MGR" == "pkg" ]]; then
  pkg update -y
  pkg install -y git curl build-essential python python-dev python-pip
fi

echo "[2] Cek Golang..."
if command -v go >/dev/null 2>&1; then
  echo "  Golang versi: $(go version)"
else
  echo "  Golang tidak terinstall."
fi

echo "[3] Cek Python..."
if command -v python3 >/dev/null 2>&1; then
  echo "  Python versi: $(python3 --version)"
else
  echo "  Python3 tidak terinstall."
fi

echo "[4] Cek Node.js..."
NODE_VER=$(get_node_major_version)
echo "  Node.js versi saat ini: $NODE_VER"

if [[ "$NODE_VER" -lt "$MIN_NODE_VERSION" ]]; then
  echo "  Versi Node.js < $MIN_NODE_VERSION, mulai instalasi Node.js versi $MIN_NODE_VERSION..."

  if [[ "$PKG_MGR" == "apt" ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - & spinner $!
    sudo apt-get install -y nodejs & spinner $!
  elif [[ "$PKG_MGR" == "pkg" ]]; then
    pkg install -y nodejs-lts & spinner $!
  fi

  NODE_VER=$(get_node_major_version)
  echo "  Node.js sekarang versi: $NODE_VER"
else
  echo "  Node.js versi memenuhi syarat."
fi

echo "[5] Clone repo bot ke $INSTALL_DIR ..."
if [ -d "$INSTALL_DIR" ]; then
  echo "  Folder $INSTALL_DIR sudah ada, update repo..."
  cd "$INSTALL_DIR"
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  git clone --branch "$BRANCH" "$GITHUB_REPO" "$INSTALL_DIR" & spinner $!
  cd "$INSTALL_DIR"
fi

echo "[6] Copy .env.example ke .env dan update NUMBER..."
if [ ! -f ".env.example" ]; then
  echo "  File .env.example tidak ditemukan di repo!"
  exit 1
fi
cp -f .env.example .env

sed -i "s/^NUMBER=.*/NUMBER=$USER_NUMBER/" .env

echo "[7] Install npm dependencies..."
npm install & spinner $!

echo
echo "=== Instalasi selesai! ==="
echo "Bot siap dijalankan di folder $INSTALL_DIR"
echo "Nomor bot yang digunakan: $USER_NUMBER"
