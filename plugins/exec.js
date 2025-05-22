import path from "path";
import util from "util";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import cp, { exec as _exec } from "child_process";
let exec = util.promisify(_exec).bind(cp);

/**
 * Hook before message processed
 * Support eval JS with context { m, conn }
 * Support shell exec
 */
export async function before(m, { client, plugins, scrapers, Func }) {
  if (m.isBaileys) return false;
  if (!m.isOwner) return false;

  const bodyLower = m.body.toLowerCase();

  // Handle eval JS > or =>
  if (bodyLower.startsWith(">") || bodyLower.startsWith("=>")) {
    // Ambil kode tanpa prefix > atau =>
    const code = m.body.startsWith("=>")
      ? m.body.slice(2).trim()
      : m.body.slice(1).trim();

    let result;
    try {
      // Buat fungsi async dan eksekusi dengan konteks {m, conn: client}
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const fn = new AsyncFunction("m", "conn", code);
      result = await fn.call(client, m, client);
    } catch (e) {
      result = e.toString();
    }

    await m.reply(typeof result === "string" ? result : util.format(result));
    return true; // sudah di-handle, stop handler lain
  }

  // Handle shell exec $ atau exec
  if (bodyLower.startsWith("$") || bodyLower.startsWith("exec")) {
    // Ambil command shell
    const cmd = bodyLower.startsWith("$")
      ? m.body.slice(1).trim()
      : m.body.split(" ").slice(1).join(" ").trim();

    try {
      const { stdout, stderr } = await exec(cmd);
      if (stdout) await m.reply(stdout);
      if (stderr) await m.reply(stderr);
    } catch (e) {
      await m.reply(e.toString());
    }
    return true; // sudah di-handle, stop handler lain
  }

  return false; // tidak di-handle, lanjut handler utama
}
