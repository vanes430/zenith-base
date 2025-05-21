export async function before(m) {
  if (m.isBaileys || m.fromMe || !m.quoted || !m.quoted.fromMe) return;
  let regexPattern = (text) =>
    new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  let id = Object.keys(global.db.bots.replyText).find((v) => {
    return global.db.bots.replyText[v].text === m.quoted.body;
  });

  let replyText = global.db.bots.replyText[id];

  if (id && replyText && !replyText.input) {
    if (replyText.command) {
      replyText.input = true;
      let command = replyText.command.replace("INPUT", m.body);
      this.preSudo(command, m.sender, m).then(async (_) => {
        this.ev.emit("messages.upsert", _);
      });
    } else if (Array.isArray(replyText.list)) {
      let command = replyText.list.find(
        (v) => v[1].toLowerCase() === m.body.toLowerCase(),
      );
      if (command) {
        this.preSudo(command[0], m.sender, m).then(async (_) => {
          this.ev.emit("messages.upsert", _);
        });
      }
    }
    return !0;
  }
  return !0;
}
