export default {
  cmd: ["stop"],
  name: "stop",
  category: "main",
  description: "Stop otomatis restart watcher (bot tetap berjalan)",
  isOwner: true,
  async execute(m, { Func: func }) {
    try {
      await m.reply("⏹️ Mematikan auto-restart watcher...");
      if (process.send) {
        process.send("STOP_RESTART"); // kirim pesan ke watcher via IPC
      } else {
        await m.reply("⚠️ Fitur stop restart tidak didukung di environment ini.");
      }
    } catch (e) {
      await m.reply("❌ Gagal kirim stop pesan: " + e.message);
    }
  },
};
