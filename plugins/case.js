export async function before(m, { plugins, scrapers, Func }) {
const prefixCase = [".", "!"];

if (typeof m.body === "string" && prefixCase.some(prefix => m.body.startsWith(prefix))) {
const command = m.body.slice(1).toLowerCase();

switch (command) {
case "helo":
m.reply("halojuga");
break;
// Tambahkan case lainnya sesuai kebutuhan
}
}
}
