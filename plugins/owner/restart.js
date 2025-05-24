export default {
  cmd: ["restart"],
  name: "restart",
  category: "main",
  description: "Restart bot dengan exit process (watcher akan restart)",
  isOwner: true,
  async execute(m, { Func: func }) {
    try {
      await m.reply("🔄 Restarting bot... Tunggu sebentar ya!");
      setTimeout(() => {
        process.exit(0); // keluar agar watcher restart
      }, 1500);
    } catch (e) {
      await m.reply("❌ Gagal restart bot: " + e.message);
    }
  },
};
