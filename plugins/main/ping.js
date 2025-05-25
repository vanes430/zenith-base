import os from "os";
import { performance } from "perf_hooks";
import fetch from "node-fetch";
import disk from "diskusage";

export default {
  cmd: ["ping", "."],
  name: "ping",
  category: "main",
  description: "Ping lengkap dengan swap, disk, CPU, RAM, lokasi, uptime bot & system, dan waktu respon (detik + ms)",
  async execute(m, { Func: func }) {
    // Fungsi konversi detik ke format waktu fleksibel (hilangkan bagian 0)
    function runtime(seconds) {
      seconds = Math.floor(seconds);
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;

      const parts = [];
      if (d > 0) parts.push(`${d} hari`);
      if (h > 0) parts.push(`${h} jam`);
      if (m > 0) parts.push(`${m} menit`);
      if (s > 0 || parts.length === 0) parts.push(`${s} detik`);

      return parts.join(" ");
    }

    // Fungsi format ukuran byte ke KB, MB, GB dll
    function formatSize(bytes) {
      if (bytes === 0) return '0 B';
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    try {
      const start = performance.now();
      await m.react("✨");
      const end = performance.now();

      const more = String.fromCharCode(8206);
      const readmore = more.repeat(4001);

      // Waktu respons bot dalam detik dan ms
      const elapsedSec = ((end - start) / 1000).toFixed(2);
      const elapsedMs = Math.round(end - start);

      // CPU & mem info
      const cpus = os.cpus();
      const cpuCount = cpus.length;
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // CPU load (user + sys) dari semua core
      const totalTimes = cpus.reduce((acc, cpu) => {
        for (const [type, time] of Object.entries(cpu.times)) {
          acc[type] = (acc[type] || 0) + time;
        }
        return acc;
      }, {});
      const totalAll = Object.values(totalTimes).reduce((a, b) => a + b, 0);
      const busy = (totalTimes.user || 0) + (totalTimes.sys || 0);
      const cpuLoadPercent = ((busy / totalAll) * 100).toFixed(2);

      // Model CPU unik
      const cpuModels = [...new Set(cpus.map(cpu => cpu.model))].join(", ");

      // Disk usage root path
      const rootPath = os.platform() === "win32" ? "c:\\" : "/";
      let diskInfo = { available: 0, total: 0 };
      try {
        diskInfo = disk.checkSync(rootPath);
      } catch {
        // gagal baca disk
      }

      // Swap info Linux
      let swapUsed = 0, swapTotal = 0;
      try {
        const fs = await import("fs/promises");
        const content = await fs.readFile("/proc/meminfo", "utf8");
        const lines = content.split("\n");
        const swapTotalLine = lines.find(line => line.startsWith("SwapTotal:"));
        const swapFreeLine = lines.find(line => line.startsWith("SwapFree:"));
        if (swapTotalLine && swapFreeLine) {
          const totalKb = parseInt(swapTotalLine.match(/\d+/)[0]);
          const freeKb = parseInt(swapFreeLine.match(/\d+/)[0]);
          swapUsed = (totalKb - freeKb) * 1024;
          swapTotal = totalKb * 1024;
        }
      } catch {
        // tidak ada swap info
      }

      // Lokasi bot via API
      let city = "Unknown", country = "Unknown";
      try {
        const res = await fetch("https://ipapi.co/json/");
        const json = await res.json();
        city = json.city || city;
        country = json.country_name || country;
      } catch {}

      // Uptime bot dan system
      const botUptime = process.uptime();
      const systemUptime = os.uptime();

      const teks = `
✨ Bot Delay: *${elapsedSec} seconds* (${elapsedMs} ms)
${readmore}
⏱️ Uptime Bot: *${runtime(botUptime)}*
⏱️ Uptime System: *${runtime(systemUptime)}*

⚙️ CPU model(s): \n> ${cpuModels}
🖥️ CPU cores: *${cpuCount}*

💾 RAM: *${formatSize(usedMem)}* / *${formatSize(totalMem)}*
🔄 Swap: *${formatSize(swapUsed)}* / *${formatSize(swapTotal)}*
💽 Disk: *${formatSize(diskInfo.total - diskInfo.available)}* / *${formatSize(diskInfo.total)}*

📊 CPU Load: *${cpuLoadPercent}%*

📍 Bot location: *${city}, ${country}*
      `.trim();

      m.reply(teks);
    } catch (e) {
      m.reply("Terjadi kesalahan saat menampilkan info ping.");
      console.error(e);
    }
  },
};
