import os from "os";
import { performance } from "perf_hooks";
import fetch from "node-fetch"; // npm i node-fetch
import disk from "diskusage";   // npm i diskusage

export default {
  cmd: ["ping", "."],
  name: "ping",
  category: "main",
  description: "Ping lengkap dengan swap, disk, CPU, RAM, lokasi, dan waktu respon (detik + ms)",
  async execute(m, { Func: func }) {
    try {
      const start = performance.now();
      await m.react("✨");
      const end = performance.now();
      const more = String.fromCharCode(8206);
      const readmore = more.repeat(4001);

      // Waktu respons bot dalam detik dan ms
      const elapsedSec = ((end - start) / 1000).toFixed(2);
      const elapsedMs = Math.round(end - start);

      const cpus = os.cpus();
      const cpuCount = cpus.length;
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // Hitung load total CPU (user + sys dari semua core)
      const totalTimes = cpus.reduce((acc, cpu) => {
        for (const [type, time] of Object.entries(cpu.times)) {
          acc[type] = (acc[type] || 0) + time;
        }
        return acc;
      }, {});
      const totalAll = Object.values(totalTimes).reduce((a, b) => a + b, 0);
      const busy = (totalTimes.user || 0) + (totalTimes.sys || 0);
      const cpuLoadPercent = ((busy / totalAll) * 100).toFixed(2);

      // CPU model unik
      const cpuModels = [...new Set(cpus.map(cpu => cpu.model))].join(", ");

      // Disk usage (root path)
      let diskInfo = { available: 0, total: 0 };
      try {
        diskInfo = await disk.check("/");
      } catch {
        // gagal baca disk, biar 0 saja
      }

      // Swap info (Linux only)
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
        // gagal baca swap, biar kosong saja
      }

      // Fetch lokasi dari API ipapi.co (tanpa IP)
      let city = "Unknown", country = "Unknown";
      try {
        const res = await fetch("https://ipapi.co/json/");
        const json = await res.json();
        city = json.city || city;
        country = json.country_name || country;
      } catch {
        // gagal fetch lokasi, tetap Unknown
      }

      const teks = `
✨ Bot Delay: *${elapsedSec} seconds* (${elapsedMs} ms)
⏱️ Uptime: ${func.runtime(process.uptime())}
${readmore}
⚙️ CPU model(s): ${cpuModels}
🖥️ CPU cores: *${cpuCount}*

💾 RAM: *${func.formatSize(usedMem)}* / *${func.formatSize(totalMem)}*
🔄 Swap: *${func.formatSize(swapUsed)}* / *${func.formatSize(swapTotal)}*
💽 Disk: *${func.formatSize(diskInfo.total - diskInfo.available)}* / *${func.formatSize(diskInfo.total)}*

📊 CPU Load: *${cpuLoadPercent}%*

📍 Bot location: *${city}, ${country}*
      `.trim();

      m.reply(teks);
    } catch (e) {
      m.reply("Terjadi kesalahan saat menampilkan info ping.");
    }
  },
};
