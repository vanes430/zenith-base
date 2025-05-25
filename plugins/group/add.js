export default {
  cmd: ["add"],
  name: "add",
  category: "group",
  description: "Kirim link undangan grup ke nomor via PM",
  isGroup: true,
  isAdmin: true,
  async execute(m, { client }) {
    console.log("Command .add dijalankan oleh:", m.sender);
    const body = typeof m.body === "string" ? m.body : "";
    const args = body.trim().split(/\s+/);
    const groupId = m.chat;

    if (!args[1]) {
      console.log("Tidak ada nomor diberikan.");
      return m.reply("Harap masukkan nomor yang ingin dikirimi link undangan. Contoh: .add 628123456789");
    }

    let groupMeta;
    try {
      groupMeta = await client.groupMetadata(groupId);
      console.log("Metadata grup berhasil didapat:", groupMeta.subject);
    } catch (e) {
      console.error("Gagal mengambil metadata grup:", e);
      return m.reply("Gagal mengambil data grup.");
    }

    const botNumber = client.user.id.split(":")[0] + "@s.whatsapp.net";
    const botIsAdmin = groupMeta.participants.find(p => p.id === botNumber)?.admin != null;
    console.log(`Bot jadi admin grup: ${botIsAdmin}`);
    if (!botIsAdmin) {
      return m.reply("Saya harus menjadi admin grup untuk menjalankan perintah ini.");
    }

    let inviteCode;
    try {
      inviteCode = await client.groupInviteCode(groupId);
      console.log("Kode invite dari method groupInviteCode:", inviteCode);
    } catch (e) {
      console.error("Gagal dapatkan invite code dari method groupInviteCode:", e);
    }

    if (!inviteCode) {
      return m.reply("Tidak bisa mendapatkan kode undangan grup. Pastikan grup memiliki link undangan yang aktif.");
    }

    const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
    console.log("Invite link yang akan dikirim:", inviteLink);

    const nomorRaw = args[1];
    const nomor = nomorRaw.replace(/[^0-9]/g, "");
    const jid = nomor + "@s.whatsapp.net";
    console.log("Nomor yang dituju:", nomor, "JID:", jid);

    try {
      await client.sendMessage(jid, {
        text: `Kamu diundang ke grup *${groupMeta.subject}*.\nSilakan gabung lewat link ini:\n${inviteLink}`,
      });
      console.log("Link undangan berhasil dikirim ke nomor:", nomor);
      return m.reply(`Link undangan grup sudah saya kirim ke nomor ${nomor}.`);
    } catch (err) {
      console.error("Gagal mengirim link undangan ke nomor:", nomor, err);
      return m.reply("Gagal mengirim link undangan ke nomor tersebut.");
    }
  },
};
