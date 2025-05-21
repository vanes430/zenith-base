/**
 * Enhanced Message Handler for WhatsApp Bot
 * Integrates with database and handles plugin execution
 */

import config from "./configs/config.js";
import baileys from "baileys";
import Color from "./lib/color.js";
import util from "util";

import { exec } from "child_process";
import { plugins } from "./configs/plugins.js";
import { scrapers } from "./configs/scrapers.js";
import { loadDatabase } from "./configs/localdb.js";
import Func from "./lib/function.js";

const { delay, jidNormalizedUser } = baileys;

const checkUserPermissions = (m, db) => {
  const user = db.users[m.sender];
  return {
    isPrems: user?.premium || m.isOwner,
    isVIP: user?.VIP || m.isOwner,
    isBanned: user?.banned || false,
    userLimit: user?.limit || 0,
    userLevel: user?.level || 1,
    userExp: user?.exp || 0,
  };
};

const checkGroupSettings = (m, db) => {
  if (!m.isGroup) return {};
  const group = db.groups[m.chat];
  return {
    isMuted: group?.mute || false,
    isWelcome: group?.welcome || false,
    isLeave: group?.leave || false,
    isAntilink: group?.antilink || false,
    isAntispam: group?.antispam || false,
    isNotification: group?.notification || false,
  };
};

const logMessage = async (client, m) => {
  if (!m.message) return;

  console.log(
    Color.cyan("From"),
    Color.cyan(await client.getName(m.chat)),
    Color.blueBright(m.chat),
  );
  console.log(
    Color.yellowBright("Chat Type"),
    Color.yellowBright(
      m.isGroup
        ? `Group (${m.sender} : ${await client.getName(m.sender)})`
        : "Private",
    ),
  );
  console.log(
    Color.greenBright("Message:"),
    Color.greenBright(m.body || m.type),
  );
};

const checkPluginConditions = (plugin, m, groupSettings, userPerms) => {
  if (plugin.isOwner && !m.isOwner) return "owner";
  if (plugin.isPremium && !userPerms.isPrems) return "premium";
  if (plugin.isVIP && !userPerms.isVIP) return "VIP";
  if (plugin.isGroup && !m.isGroup) return "group";
  if (plugin.isBotAdmin && !m.isBotAdmin) return "botAdmin";
  if (plugin.isAdmin && !m.isAdmin) return "admin";
  if (plugin.isPrivate && m.isGroup) return "private";
  if (plugin.isQuoted && !m.isQuoted) return "quoted";

  if (m.isGroup) {
    if (plugin.isNsfw && !groupSettings.isNsfw) return "NSFW tidak aktif";
    if (plugin.isGame && !groupSettings.isGame)
      return "Game tidak aktif di chat ini";
  }

  return false;
};

/**
 * Check command usage pattern
 * @param {Object} plugin Plugin object
 * @param {Object} m Message object
 * @returns {string|false} Usage message if pattern doesn't match, false if matches
 */
const checkUsagePattern = (plugin, m) => {
  if (!plugin.usages || !Array.isArray(plugin.usages)) return false;

  const { args, command, prefix } = m;

  // Find matching usage pattern based on args length
  const matchingPattern = plugin.usages.find((usage) => {
    const pattern = usage[0].split(" ");
    const cmdName = pattern[0];
    const paramCount = pattern.slice(1).length;
    return cmdName === command && paramCount === args.length;
  });

  if (!matchingPattern) {
    // Generate usage message
    const usageList = plugin.usages
      .map(([usage, desc]) => `◦ ${prefix}${usage}\n  ${desc}`)
      .join("\n");

    return `❌ Invalid usage pattern\n\n*Usage Examples:*\n${usageList}`;
  }

  return false;
};

const handleMessagesUpsert = async (client, store, m, messages) => {
  try {
    await loadDatabase(m);

    const quoted = m.isQuoted ? m.quoted : m;

    if (m.isBaileys) return;
    if (config.self && !m.isOwner) return;

    const userPerms = checkUserPermissions(m, global.db);
    const groupSettings = checkGroupSettings(m, global.db);

    if (m.isGroup && groupSettings.isMuted && !m.isOwner) return;

    if (userPerms.isBanned && !m.isOwner) {
      m.reply("Maaf, akun anda sedang dibanned!");
      return;
    }

    await logMessage(client, m);

    for (let name in plugins) {
      const plugin = plugins[name];
      if (!plugin || plugin.disabled) continue;

      try {
        if (typeof plugin.all === "function") {
          await plugin.all.call(client, m, { messages, plugins, scrapers });
        }

        if (typeof plugin.before === "function") {
          if (
            await plugin.before.call(client, m, {
              messages,
              plugins,
              scrapers,
              Func,
            })
          )
            continue;
        }

        if (m.prefix) {
          const { args, text, prefix } = m;
          const isCommand = (m.prefix && m.body.startsWith(m.prefix)) || false;
          const command = isCommand ? m.command.toLowerCase() : false;

          const isAccept = Array.isArray(plugin.cmd)
            ? plugin.cmd.includes(command)
            : plugin.cmd === command;

          if (!isAccept) continue;

          m.plugin = name;
          m.isCommand = true;

          // Check conditions and usage pattern
          const conditionError = checkPluginConditions(
            plugin,
            m,
            groupSettings,
            userPerms,
          );

          if (conditionError) {
            m.reply(config.msg[conditionError] || conditionError);
            continue;
          }

          const usageError = checkUsagePattern(plugin, m);
          if (usageError) {
            m.reply(usageError);
            continue;
          }

          if (plugin.limit && !m.isOwner) {
            if (userPerms.userLimit < plugin.limit) {
              m.reply(
                `Limit anda tidak cukup untuk menggunakan fitur ini\nLimit yang dibutuhkan: ${plugin.limit}\nLimit anda: ${userPerms.userLimit}`,
              );
              continue;
            }
            global.db.users[m.sender].limit -= plugin.limit;
          }

          try {
            await plugin.execute(m, {
              client,
              command,
              prefix,
              args,
              text,
              quoted,
              plugins,
              scrapers,
              store,
              config,
              Func,
              userPerms,
              groupSettings,
            });

            if (plugin.exp && !m.isOwner) {
              const expGain = typeof plugin.exp === "number" ? plugin.exp : 1;
              global.db.users[m.sender].exp += expGain;
            }
          } catch (error) {
            console.error(`Error in plugin ${name}:`, error);
            m.reply(util.format(error));
          } finally {
            if (typeof plugin.after === "function") {
              try {
                await plugin.after.call(m, { client });
              } catch (error) {
                console.error(
                  `Error in after function of plugin ${name}:`,
                  error,
                );
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing plugin ${name}:`, error);
      }
    }
  } catch (error) {
    console.error(Color.redBright("Error handling message:"), error);
  }
};

export { handleMessagesUpsert };
export default {
  handleMessagesUpsert,
};
