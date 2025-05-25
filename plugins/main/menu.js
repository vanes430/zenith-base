export default {
  cmd: ["menu", "allmenu"],
  name: "menu",
  category: "main",
  description: "Menampilkan menu bot beserta detail command.",
  async execute(m, { client, prefix, plugins, userPerms }) {
    // Helper memastikan array
    const ensureArray = (v) => (!v ? [] : Array.isArray(v) ? v : [v]);

    // Helper buat tag fitur
    const getTags = (plg) =>
      [plg.limit > 0 ? "Ⓛ" : "", plg.isPremium ? "Ⓟ" : "", plg.isVIP ? "Ⓥ" : ""]
        .filter(Boolean)
        .join("");

    // Kelompokkan commands per kategori
    const commandsByCategory = {};
    Object.keys(plugins).forEach((name) => {
      const plugin = plugins[name];
      if (!plugin || plugin.disabled) return;
      const names = ensureArray(plugin.name);
      const categories = ensureArray(plugin.category || plugin.cetegory || "other");
      if (!names.length || !names[0]) return;
      categories.forEach((category) => {
        if (!category || category.toLowerCase() === "uncategorized") return;
        if (!commandsByCategory[category]) commandsByCategory[category] = [];
        commandsByCategory[category].push({
          names,
          plugin,
          tags: getTags(plugin),
          desc: plugin.description || plugin.desc || "No description",
        });
      });
    });

    // Susun sections tombol (limit 10 rows per kategori)
    const sortedCategories = Object.entries(commandsByCategory).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    const sections = sortedCategories.map(([category, cmds]) => ({
      title: category.toUpperCase(),
      rows: cmds
        .filter((cmd) => cmd.names && cmd.names[0])
        .slice(0, 10)
        .map((cmd) => ({
          id: `${prefix}${cmd.names[0]}`,
          title: `${prefix}${cmd.names[0]}`,
          description: cmd.desc,
        })),
    }));

    // Buat mention user dengan @nomor tanpa domain
    const userTag = `@${m.sender.split("@")[0]}`;

    // Susun header text menggunakan template literal
    const headerText = `Halo ${userTag} 👋

🤖 Info Bot:
- Prefix: ${prefix}
- Total Commands: ${Object.values(commandsByCategory).reduce((acc, arr) => acc + arr.length, 0)}
- Status User: ${userPerms.isPrems ? "Premium" : userPerms.isVIP ? "VIP" : "Free"}

* *Help* ${prefix}help <command> untuk info command:
`;

    // Siapkan pesan tombol interaktif type 4 nativeFlowInfo
    const buttonMessage = {
      text: headerText,
      footer: "© Zenith Bot 2025",
      buttons: [
        {
          buttonId: "menu_list",
          buttonText: { displayText: "Pilih Menu" },
          type: 4,
          nativeFlowInfo: {
            name: "single_select",
            paramsJson: JSON.stringify({
              title: "Daftar Menu Bot",
              sections,
            }),
          },
        },
      ],
      headerType: 1,
      mentions: [m.sender], // Supaya @user muncul dan dapat notifikasi
    };

    await client.sendMessage(m.chat, buttonMessage, { quoted: m });
  },
};
