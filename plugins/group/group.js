export default {
  cmd: ["group"],
  name: "group",
  category: "group",
  description: "Close and Open Group",
  isGroup: true,
  isAdmin: true,
  isBotAdmin: true,
  execute: async (m, { client }) => {
    let isClose = {
      // Switch Case Like :v
      open: "not_announcement",
      close: "announcement",
    }[m.args[0] || ""];
    if (isClose === undefined)
      throw `
*Format salah! Contoh :*
  *○ ${m.prefix + m.command} close*
  *○ ${m.prefix + m.command} open*
`.trim();
    await client.groupSettingUpdate(m.chat, isClose);
  },
};
