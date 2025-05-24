const cmd = {
  cmd: ["menu", "help", "allmenu"],
  name: ["menu"],
  category: ["main"],
  description: "Menampilkan menu bot",
};

cmd.execute = async (
  m,
  {
    client,
    args,
    prefix,
    command,
    text,
    plugins,
    API,
    Func,
    userPerms,
    groupSettings,
  },
) => {
  try {
    const commandsByCategory = {};

    // Helper function to ensure array format
    const ensureArray = (value) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };

    Object.keys(plugins).forEach((name) => {
      const plugin = plugins[name];
      if (!plugin || plugin.disabled) return;

      const commandNames = ensureArray(plugin.name);
      if (!commandNames.length) return;

      // Fix for typo in category name (cetegory -> category)
      const category = plugin.category || plugin.cetegory || "other";
      const categories = ensureArray(category);

      categories.forEach((category) => {
        // Skip uncategorized commands
        if (category.toLowerCase() === "uncategorized") return;

        if (!commandsByCategory[category]) {
          commandsByCategory[category] = new Map();
        }

        const cmdInfo = {
          names: commandNames,
          rowId: prefix + commandNames[0],
          isLimit: plugin.limit > 0,
          isPremium: plugin.isPremium,
          isVIP: plugin.isVIP,
          desc: plugin.desc || "No description",
        };

        commandsByCategory[category].set(commandNames[0], cmdInfo);
      });
    });

    const totalCommands = Object.values(commandsByCategory).reduce(
      (total, cmds) => total + cmds.size,
      0,
    );

    let menuText = `Hi ${m.pushName || "User"} 👋\n\n`;
    menuText += `🤖 Bot Info:\n`;
    menuText += `◦ Prefix: ${prefix}\n`;
    menuText += `◦ Time: ${new Date().toLocaleString()}\n`;
    menuText += `◦ Total Commands: ${totalCommands}\n`;
    menuText += `◦ User Status: ${userPerms.isPrems ? "Premium" : userPerms.isVIP ? "VIP" : "Free"}\n`;
    menuText += `◦ Limit: ${userPerms.userLimit}\n`;
    menuText += `◦ Level: ${userPerms.userLevel}\n`;
    menuText += `◦ Exp: ${userPerms.userExp}\n\n`;

    // If text parameter is provided, show detailed help for specific command
    if (text) {
      const plugin = Object.values(plugins).find((plugin) => {
        if (plugin && plugin.name) {
          const names = ensureArray(plugin.name);
          return names.some((n) => n && n.toLowerCase() === text.toLowerCase());
        }
        return false;
      });

      if (plugin) {
        const allNames = ensureArray(plugin.name);
        const categories = ensureArray(plugin.category || plugin.cetegory);

        let helpText = `🔍 *Command Details*\n\n`;
        helpText += `◦ Names: ${allNames.map((n) => prefix + n).join(", ")}\n`;
        helpText += `◦ Category: ${categories.join(", ") || "Other"}\n`;
        helpText += `◦ Description: ${plugin.description || "No description"}\n`;
        helpText += `◦ Usage: ${prefix}${allNames[0]} ${Object.entries(
          plugin.options || {},
        )
          .map(([k, v]) => `<${v}>`)
          .join(" ")}\n\n`;

        helpText += `📝 Options:\n`;
        Object.entries(plugin.options || {}).forEach(([key, value]) => {
          helpText += `◦ ${key}: ${value}\n`;
        });

        helpText += `\n📋 Requirements:\n`;
        helpText += `${plugin.isGroup ? "◦ Group\n" : ""}`;
        helpText += `${plugin.isAdmin ? "◦ Admin Group\n" : ""}`;
        helpText += `${plugin.isBotAdmin ? "◦ Bot Admin\n" : ""}`;
        helpText += `${plugin.isPrivate ? "◦ Private Chat\n" : ""}`;
        helpText += `${plugin.isPremium ? "◦ Premium User\n" : ""}`;
        helpText += `${plugin.isVIP ? "◦ VIP User\n" : ""}`;
        helpText += `${plugin.isOwner ? "◦ Owner\n" : ""}`;
        helpText += `${plugin.isQuoted ? "◦ Quoted Message\n" : ""}`;
        helpText += `${plugin.limit ? `◦ Limit: ${plugin.limit}\n` : ""}`;

        return m.reply(helpText);
      } else {
        return m.reply(`Command "${text}" not found.`);
      }
    }

    // Display regular menu if no specific command is requested
    const sortedCategories = Object.entries(commandsByCategory).sort(
      ([a], [b]) => a.localeCompare(b),
    );

    sortedCategories.forEach(([category, commands]) => {
      if (commands.size > 0) {
        menuText += `📑 *${category.toUpperCase()}*\n`;
        Array.from(commands.values())
          .sort((a, b) => a.names[0].localeCompare(b.names[0]))
          .forEach((cmd) => {
            const tags = [];
            if (cmd.isLimit) tags.push("Ⓛ");
            if (cmd.isPremium) tags.push("Ⓟ");
            if (cmd.isVIP) tags.push("Ⓥ");

            // Display each command name on a new line if it's an array
            if (cmd.names.length > 1) {
              cmd.names.forEach((name) => {
                menuText += `◦ ${prefix}${name} ${tags.join("")}\n`;
              });
            } else {
              menuText += `◦ ${prefix}${cmd.names[0]} ${tags.join("")}\n`;
            }
          });
        menuText += "\n";
      }
    });

    menuText += `Ketik ${prefix}help <command> untuk melihat detail command`;

    const url = "https://github.com/vanes430";

    const message = {
      extendedTextMessage: {
        text: menuText,
        contextInfo: {
          externalAdReply: {
            title: "Zenith Bot",
            body: "Zenith Base gratis",
            mediaType: 1,
            thumbnailUrl: global.db.settings.logo,
            sourceUrl: url,
            renderLargerThumbnail: true,
          },
        },
      },
    };

    const waMessage = await Func.baileys.generateWAMessageFromContent(
      m.chat,
      message,
      {
        quoted: m,
      },
    );

    return await client.relayMessage(m.chat, waMessage.message, {
      messageId: waMessage.key.id,
    });
  } catch (error) {
    console.error("Error in menu command:", error);
    m.reply("Terjadi error saat menampilkan menu.");
  }
};

export default cmd;
