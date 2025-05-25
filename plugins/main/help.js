export default {
  cmd: ["help"],
  name: "help",
  category: "main",
  description: "Menampilkan detail command tertentu.",
  async execute(m, { client, args, prefix, plugins }) {
    const ensureArray = (v) => (!v ? [] : Array.isArray(v) ? v : [v]);

    const inputCmd = (args.join(" ") || "").trim();
    if (!inputCmd) {
      return m.reply(`Gunakan format: *${prefix}help <command>*\nContoh: *${prefix}help ai*`);
    }

    // Normalisasi string: hilangkan prefix (jika ada), titik di depan, dan lowerCase
    function normalize(s) {
      let x = String(s || "").trim();
      // Hilangkan prefix jika ada (dan prefix tidak kosong)
      if (prefix && x.startsWith(prefix)) x = x.slice(prefix.length);
      // Hilangkan titik depan jika ada
      if (x.startsWith(".")) x = x.slice(1);
      return x.toLowerCase();
    }

    const searchText = normalize(inputCmd);

    const plugin = Object.values(plugins).find((plg) => {
      if (!plg || typeof plg !== "object") return false;
      const names = ensureArray(plg.name);
      const cmds = ensureArray(plg.cmd);
      // Cari, apapun user input: tanpa prefix, pakai prefix, pakai titik, tanpa titik
      return [...names, ...cmds].some((n) => normalize(n) === searchText);
    });

    if (plugin) {
      const names = ensureArray(plugin.name).map(String);
      const cmds = ensureArray(plugin.cmd).map(String);
      const categories = ensureArray(plugin.category || plugin.cetegory || "Other");
      const usage = plugin.usages
        ? Array.isArray(plugin.usages)
          ? plugin.usages.map(u =>
              Array.isArray(u)
                ? u.map(v => `${prefix}${v}`).join(" / ")
                : `${prefix}${u}`
            ).join("\n- ")
          : `${prefix}${plugin.usages}`
        : cmds.length
          ? cmds.map(u => `${prefix}${u}`).join(", ")
          : names.map(u => `${prefix}${u}`).join(", ");
      let helpText =
        `🔍 *Command Details*\n\n` +
        `- Names: ${names.map((n) => prefix + n).join(", ")}\n` +
        (cmds.length ? `- Alias: ${cmds.map((n) => prefix + n).join(", ")}\n` : "") +
        `- Category: ${categories.join(", ")}\n` +
        `- Description: ${plugin.description || plugin.desc || "No description"}\n` +
        `- Usage: ${usage}\n\n` +
        `📝 *Options:*\n`;
      if (plugin.options) {
        Object.entries(plugin.options).forEach(([k, v]) => {
          helpText += `- ${k}: ${v}\n`;
        });
      } else {
        helpText += `- Tidak ada opsi khusus\n`;
      }
      helpText += `\n📋 *Requirements:*\n`;
      [
        ["Group", plugin.isGroup],
        ["Admin Group", plugin.isAdmin],
        ["Bot Admin", plugin.isBotAdmin],
        ["Private Chat", plugin.isPrivate],
        ["Premium User", plugin.isPremium],
        ["VIP User", plugin.isVIP],
        ["Owner", plugin.isOwner],
        ["Quoted Message", plugin.isQuoted],
        [plugin.limit ? `Limit: ${plugin.limit}` : null, plugin.limit],
      ].forEach(([label, cond]) => {
        if (cond && label) helpText += `- ${label}\n`;
      });

      return m.reply(helpText.trim());
    }

    return m.reply(`Command "${args.join(" ")}" tidak ditemukan. Pastikan penulisannya benar. Cek juga dengan *${prefix}menu* untuk daftar lengkap.`);
  }
};
