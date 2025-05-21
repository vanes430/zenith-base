import config from "../configs/config.js";
import Function from "./function.js";
import Helper from "../configs/helper.js";
import { writeExif } from "./sticker.js";
import fs from "fs";
import path from "path";
import util from "util";
import chalk from "chalk";
import Crypto from "crypto";
import baileys from "baileys";
import { parsePhoneNumber } from "libphonenumber-js";
import { fileTypeFromBuffer } from "file-type";
import { fileURLToPath } from "url";

const {
  generateWAMessage,
  generateWAMessageFromContent,
  proto,
  prepareWAMessageMedia,
  jidNormalizedUser,
  WA_DEFAULT_EPHEMERAL,
} = baileys;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function toSHA256(str) {
  return Crypto.createHash("sha256").update(str).digest("hex");
}

function Client({ client: conn, store }) {
  delete store.groupMetadata;
  for (let v in store) {
    conn[v] = store[v];
  }
  const client = Object.defineProperties(conn, {
    appenTextMessage: {
      async value(m, text, chatUpdate) {
        let messages = await baileys.generateWAMessage(
          m.chat,
          { text: text, mentions: m.mentionedJid },
          { userJid: conn.user.id, quoted: m.quoted && m.quoted.fakeObj }
        );
        messages.key.fromMe = baileys.areJidsSameUser(m.sender, conn.user.id);
        messages.key.id = m.key.id;
        messages.pushName = m.pushName;
        if (m.isGroup) messages.participant = m.sender;
        let msg = {
          ...chatUpdate,
          messages: [baileys.proto.WebMessageInfo.fromObject(messages)],
          type: "append",
        };
        conn.ev.emit("messages.upsert", msg);
      },
    },
    logger: {
      get() {
        return {
          info(...args) {
            console.log(
              chalk.bold.bgRgb(51, 204, 51)("INFO "),
              chalk.cyan(util.format(...args))
            );
          },
          error(...args) {
            console.log(
              chalk.bold.bgRgb(247, 38, 33)("ERROR "),
              chalk.rgb(255, 38, 0)(util.format(...args))
            );
          },
          warn(...args) {
            console.log(
              chalk.bold.bgRgb(255, 153, 0)("WARNING "),
              chalk.redBright(util.format(...args))
            );
          },
          trace(...args) {
            console.log(
              chalk.grey("TRACE "),
              chalk.white(util.format(...args))
            );
          },
          debug(...args) {
            console.log(
              chalk.bold.bgRgb(66, 167, 245)("DEBUG "),
              chalk.white(util.format(...args))
            );
          },
        };
      },
      enumerable: true,
    },
    smlcap: {
      value(text, except = []) {
        if (!text) return text;
        let regex =
          /(wa.me|https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi;
        let link = text.match(regex);
        let smlcap = (res) =>
          res
            .replace(/a|A/g, "ᴀ")
            .replace(/b|B/g, "ʙ")
            .replace(/c|C/g, "ᴄ")
            .replace(/d|D/g, "ᴅ")
            .replace(/e|E/g, "ᴇ")
            .replace(/f|F/g, "ꜰ")
            .replace(/g|G/g, "ɢ")
            .replace(/h|H/g, "ʜ")
            .replace(/i|I/g, "ɪ")
            .replace(/j|J/g, "ᴊ")
            .replace(/k|K/g, "ᴋ")
            .replace(/l|L/g, "ʟ")
            .replace(/m|M/g, "ᴍ")
            .replace(/n|N/g, "ɴ")
            .replace(/o|O/g, "ᴏ")
            .replace(/p|P/g, "ᴘ")
            .replace(/q|Q/g, "ǫ")
            .replace(/r|R/g, "ʀ")
            .replace(/s|S/g, "ꜱ")
            .replace(/t|T/g, "ᴛ")
            .replace(/u|U/g, "ᴜ")
            .replace(/v|V/g, "ᴠ")
            .replace(/w|W/g, "ᴡ")
            .replace(/x|X/g, "x")
            .replace(/y|Y/g, "ʏ")
            .replace(/z|Z/g, "ᴢ");
        let result = smlcap(text);
        if (except.length > 0) {
          for (let i = 0; i < except.length; i++) {
            result = result.replace(smlcap(except[i]), except[i]);
          }
          if (link) {
            for (let i = 0; i < link.length; i++) {
              result = result.replace(smlcap(link[i]), link[i]);
            }
            return result;
          } else {
            return result;
          }
        } else {
          if (link) {
            for (let i = 0; i < link.length; i++) {
              result = result.replace(smlcap(link[i]), link[i]);
            }
            return result;
          } else {
            return result;
          }
        }
      },
      enumerable: true,
    },
    getContentType: {
      value(content) {
        if (content) {
          const keys = Object.keys(content);
          const key = keys.find(
            (k) =>
              (k === "conversation" ||
                k.endsWith("Message") ||
                k.endsWith("V2") ||
                k.endsWith("V3")) &&
              k !== "senderKeyDistributionMessage"
          );
          return key;
        }
      },
      enumerable: true,
    },
    decodeJid: {
      value(jid) {
        if (/:\d+@/gi.test(jid)) {
          const decode = baileys.jidNormalizedUser(jid);
          return decode;
        } else return jid;
      },
    },
    generateMessageID: {
      value(id = "3EB0", length = 18) {
        return id + Crypto.randomBytes(length).toString("hex").toUpperCase();
      },
    },
    getName: {
      value(jid) {
        let id = conn.decodeJid(jid),
          v;
        if (id?.endsWith("@g.us")) {
          return new Promise(async (resolve) => {
            v = (await store.fetchGroupMetadata(jid, conn)) || {};
            resolve(v.name || v.subject || id.replace("@g.us", ""));
          });
        } else {
          v =
            id === "0@s.whatsapp.net"
              ? { id, name: "WhatsApp" }
              : id === conn.decodeJid(conn?.user?.id)
              ? conn.user
              : conn.contacts?.[id] || {};
        }
        return (
          v?.name ||
          v?.subject ||
          v?.pushName ||
          v?.notify ||
          v?.verifiedName ||
          parsePhoneNumber("+" + id.replace("@s.whatsapp.net", "")).format(
            "INTERNATIONAL"
          )
        );
      },
    },
    sendContact: {
      async value(jid, number, quoted, options = {}) {
        let list = [];
        for (let v of number) {
          list.push({
            displayName: await conn.getName(v),
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(
              v + "@s.whatsapp.net"
            )}\nFN:${await conn.getName(
              v + "@s.whatsapp.net"
            )}\nitem1.TEL;waid=${v}:${v}\nitem1.X-ABLabel:Ponsel\nitem2.EMAIL;type=INTERNET:contacts@arifzyn.tech\nitem2.X-ABLabel:Email\nitem3.URL:https://api.arifzyn.tech\nitem3.X-ABLabel:Instagram\nitem4.ADR:;;Indonesia;;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
          });
        }
        return conn.sendMessage(
          jid,
          {
            contacts: {
              displayName: `${list.length} Contact`,
              contacts: list,
            },
            mentions: quoted?.participant
              ? [conn.decodeJid(quoted?.participant)]
              : [conn.decodeJid(conn.user?.id)],
            ...options,
          },
          { quoted, ...options }
        );
      },
      enumerable: true,
    },
    parseMention: {
      value(text) {
        return (
          [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
            (v) => v[1] + "@s.whatsapp.net"
          ) || []
        );
      },
    },
    downloadMediaMessage: {
      async value(message, filename) {
        let mime = {
          imageMessage: "image",
          videoMessage: "video",
          stickerMessage: "sticker",
          documentMessage: "document",
          audioMessage: "audio",
          ptvMessage: "video",
        }[message.type];
        if ("thumbnailDirectPath" in message.msg && !("url" in message.msg)) {
          message = {
            directPath: message.msg.thumbnailDirectPath,
            mediaKey: message.msg.mediaKey,
          };
          mime = "thumbnail-link";
        } else {
          message = message.msg;
        }
        return await baileys.toBuffer(
          await baileys.downloadContentFromMessage(message, mime)
        );
      },
      enumerable: true,
    },
    sendFile: {
      /**
       * Send Media/File with Automatic Type Specifier
       * @param {String} jid
       * @param {String|Buffer} path
       * @param {String} filename
       * @param {String} caption
       * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} quoted
       * @param {Boolean} ptt
       * @param {Object} options
       */
      async value(
        jid,
        path,
        filename = "",
        text = "",
        quoted,
        ptt = false,
        options = {},
        smlcap = { smlcap: true }
      ) {
        let isSmlcap = global.db.settings.smlcap && smlcap.smlcap;
        let ephemeral =
          conn.chats[jid]?.metadata?.ephemeralDuration ||
          conn.chats[jid]?.ephemeralDuration ||
          false;
        let caption = isSmlcap
          ? conn.smlcap(text, smlcap.except ? smlcap.except : false)
          : text;
        let type = await conn.getFile(path, true);
        let { res, data: file, filename: pathFile } = type;
        if ((res && res.status !== 200) || file.length <= 65536) {
          try {
            throw { json: JSON.parse(file.toString()) };
          } catch (e) {
            if (e.json) throw e.json;
          }
        }
        const fileSize = fs.statSync(pathFile).size / 1024 / 1024;
        let opt = {};
        if (quoted) opt.quoted = quoted;
        if (!type) options.asDocument = true;
        let mtype = "",
          mimetype = options.mimetype || type.mime,
          convert;
        if (
          /webp/.test(type.mime) ||
          (/image/.test(type.mime) && options.asSticker)
        )
          mtype = "sticker";
        else if (
          /image/.test(type.mime) ||
          (/webp/.test(type.mime) && options.asImage)
        )
          mtype = "image";
        else if (/video/.test(type.mime)) mtype = "video";
        else if (/audio/.test(type.mime))
          (convert = await toAudio(file, type.ext)),
            (file = convert.data),
            (pathFile = convert.filename),
            (mtype = "audio"),
            (mimetype = options.mimetype || "audio/ogg; codecs=opus");
        else mtype = "document";
        if (options.asDocument) mtype = "document";
        delete options.asSticker;
        delete options.asLocation;
        delete options.asVideo;
        delete options.asDocument;
        delete options.asImage;
        let message = {
          ...options,
          caption,
          ptt,
          [mtype]: { url: pathFile },
          mimetype,
          fileName: filename || pathFile.split("/").pop(),
        };
        /**
         * @type {import('@adiwajshing/baileys').proto.WebMessageInfo}
         */
        let m;
        try {
          m = await conn.sendMessage(jid, message, {
            ...opt,
            ...options,
            ephemeralExpiration: ephemeral,
          });
        } catch (e) {
          console.error(e);
          m = null;
        } finally {
          if (!m)
            m = await conn.sendMessage(
              jid,
              { ...message, [mtype]: file },
              { ...opt, ...options, ephemeralExpiration: ephemeral }
            );
          file = null; // releasing the memory
          return m;
        }
      },
      enumerable: true,
    },
    getFile: {
      /**
       * getBuffer hehe
       * @param {fs.PathLike} PATH
       * @param {Boolean} saveToFile
       */
      async value(PATH, saveToFile = false) {
        let res, filename;
        const data = Buffer.isBuffer(PATH)
          ? PATH
          : PATH instanceof ArrayBuffer
          ? PATH.toBuffer()
          : /^data:.*?\/.*?;base64,/i.test(PATH)
          ? Buffer.from(PATH.split`,`[1], "base64")
          : /^https?:\/\//.test(PATH)
          ? await (res = await Function.getFile(PATH)).data
          : fs.existsSync(PATH)
          ? ((filename = PATH), fs.readFileSync(PATH))
          : typeof PATH === "string"
          ? PATH
          : Buffer.alloc(0);
        if (!Buffer.isBuffer(data))
          throw new TypeError("Result is not a buffer");
        const type = (await fileTypeFromBuffer(data)) || {
          mime: "application/octet-stream",
          ext: ".bin",
        };
        if (data && saveToFile && !filename)
          (filename = path.join(
            __dirname,
            "../../temp/" + new Date() * 1 + "." + type.ext
          )),
            await fs.promises.writeFile(filename, data);
        return {
          res,
          filename,
          ...type,
          data,
          deleteFile() {
            return filename && fs.promises.unlink(filename);
          },
        };
      },
      enumerable: true,
    },
    resize: {
      /**
       * Resize By Fokus ID
       * @param {Buffer} buffer
       * @param {String|Number} uk1
       * @param {String|Number} uk2
       * @returns
       */
      value(buffer, uk1, uk2) {
        return new Promise(async (resolve, reject) => {
          let baper = await jimp.read(buffer);
          let result = await baper
            .resize(uk1, uk2)
            .getBufferAsync(jimp.MIME_JPEG);
          resolve(result);
        });
      },
      enumerable: true,
    },
    sendMedia: {
      async value(jid, url, quoted = "", options = {}) {
        let { mime, data: buffer, ext, size } = await Function.getFile(url);
        mime = options?.mimetype ? options.mimetype : mime;
        let data = { text: "" },
          mimetype = /audio/i.test(mime) ? "audio/mpeg" : mime;
        if (size > 45000000)
          data = {
            document: buffer,
            mimetype: mime,
            fileName: options?.fileName
              ? options.fileName
              : `${conn.user?.name} (${new Date()}).${ext}`,
            ...options,
          };
        else if (options.asDocument)
          data = {
            document: buffer,
            mimetype: mime,
            fileName: options?.fileName
              ? options.fileName
              : `${conn.user?.name} (${new Date()}).${ext}`,
            ...options,
          };
        else if (options.asSticker || /webp/.test(mime)) {
          let pathFile = await writeExif(
            { mimetype, data: buffer },
            { ...options }
          );
          data = {
            sticker: fs.readFileSync(pathFile),
            mimetype: "image/webp",
            ...options,
          };
          fs.existsSync(pathFile) ? await fs.promises.unlink(pathFile) : "";
        } else if (/image/.test(mime))
          data = {
            image: buffer,
            mimetype: options?.mimetype ? options.mimetype : "image/png",
            ...options,
          };
        else if (/video/.test(mime))
          data = {
            video: buffer,
            mimetype: options?.mimetype ? options.mimetype : "video/mp4",
            ...options,
          };
        else if (/audio/.test(mime))
          data = {
            audio: buffer,
            mimetype: options?.mimetype ? options.mimetype : "audio/mpeg",
            ...options,
          };
        else
          data = {
            document: buffer,
            mimetype: mime,
            ...options,
          };
        return await conn.sendMessage(jid, data, {
          quoted,
          ...options,
        });
      },
      enumerable: true,
    },
    cMod: {
      value(jid, copy, text = "", sender = conn.user.id, options = {}) {
        let mtype = conn.getContentType(copy.message);
        let content = copy.message[mtype];
        if (typeof content === "string") copy.message[mtype] = text || content;
        else if (content.caption) content.caption = text || content.text;
        else if (content.text) content.text = text || content.text;
        if (typeof content !== "string") {
          copy.message[mtype] = { ...content, ...options };
          copy.message[mtype].contextInfo = {
            ...(content.contextInfo || {}),
            mentionedJid:
              options.mentions || content.contextInfo?.mentionedJid || [],
          };
        }
        if (copy.key.participant)
          sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key.remoteJid.includes("@s.whatsapp.net"))
          sender = sender || copy.key.remoteJid;
        else if (copy.key.remoteJid.includes("@broadcast"))
          sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = baileys.areJidsSameUser(sender, conn.user.id);
        return baileys.proto.WebMessageInfo.fromObject(copy);
      },
    },
    sendPoll: {
      async value(chatId, name, values, options = {}) {
        let selectableCount = options?.selectableCount
          ? options.selectableCount
          : 1;
        return await conn.sendMessage(
          chatId,
          {
            poll: {
              name,
              values,
              selectableCount,
            },
            ...options,
          },
          { ...options }
        );
      },
      enumerable: true,
    },
    setProfilePicture: {
      async value(jid, media, type = "full") {
        let { data } = await Function.getFile(media);
        if (/full/i.test(type)) {
          data = await Function.resizeImage(media, 720);
          await conn.query({
            tag: "iq",
            attrs: {
              to: await conn.decodeJid(jid),
              type: "set",
              xmlns: "w:profile:picture",
            },
            content: [
              {
                tag: "picture",
                attrs: {
                  type: "image",
                },
                content: data,
              },
            ],
          });
        } else {
          data = await Function.resizeImage(media, 640);
          await conn.query({
            tag: "iq",
            attrs: {
              to: await conn.decodeJid(jid),
              type: "set",
              xmlns: "w:profile:picture",
            },
            content: [
              {
                tag: "picture",
                attrs: {
                  type: "image",
                },
                content: data,
              },
            ],
          });
        }
      },
      enumerable: true,
    },
    sendGroupV4Invite: {
      async value(
        jid,
        groupJid,
        inviteCode,
        inviteExpiration,
        groupName,
        jpegThumbnail,
        caption = "Invitation to join my WhatsApp Group",
        options = {}
      ) {
        const media = await baileys.prepareWAMessageMedia(
          {
            image: (await Function.getFile(jpegThumbnail)).data,
          },
          {
            upload: conn.waUploadToServer,
          }
        );
        const message = baileys.proto.Message.fromObject({
          groupJid,
          inviteCode,
          inviteExpiration: inviteExpiration
            ? parseInt(inviteExpiration)
            : +new Date(new Date() + 3 * 86400000),
          groupName,
          jpegThumbnail: media.imageMessage?.jpegThumbnail || jpegThumbnail,
          caption,
        });
        const m = baileys.generateWAMessageFromContent(jid, message, {
          userJid: conn.user?.id,
        });
        await conn.relayMessage(jid, m.message, {
          messageId: m.key.id,
        });
        return m;
      },
      enumerable: true,
    },
    sendListM: {
      async value(jid, text, footer, url, list, quoted, options = {}) {
        let header = {
          hasMediaAttachment: false,
        };
        if (url) {
          let { mime, data: buffer, ext, size } = await Function.getFile(url);
          if (/image|video/i.test(mime)) {
            let media;
            if (/image/i.test(mime)) {
              media = await prepareWAMessageMedia(
                { image: buffer },
                { upload: conn.waUploadToServer }
              );
            } else if (/video/i.test(mime)) {
              media = await prepareWAMessageMedia(
                { video: buffer },
                { upload: conn.waUploadToServer }
              );
            }
            header = {
              hasMediaAttachment: true,
              ...media,
            };
          }
        }
        let msg = generateWAMessageFromContent(
          jid,
          {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadata: {},
                  deviceListMetadataVersion: 2,
                },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                  body: proto.Message.InteractiveMessage.Body.create({
                    text: text,
                  }),
                  footer: proto.Message.InteractiveMessage.Footer.create({
                    text: footer,
                  }),
                  header:
                    proto.Message.InteractiveMessage.Header.create(header),
                  nativeFlowMessage:
                    proto.Message.InteractiveMessage.NativeFlowMessage.create({
                      buttons: [
                        {
                          name: "single_select",
                          buttonParamsJson: JSON.stringify({
                            title: "Click Here",
                            sections: list,
                          }),
                        },
                      ],
                    }),
                  contextInfo: options.contextInfo || {},
                  ...options,
                }),
              },
            },
          },
          { quoted, userJid: quoted.key.remoteJid }
        );
        conn.relayMessage(jid, msg.message, {
          messageId: msg.key.id,
        });
      },
      enumerable: true,
      writable: true,
    },
    reply: {
      /**
       * Reply to a message
       * @param {String} jid
       * @param {String|Buffer} text
       * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} quoted
       * @param {Object} options
       */
      value(jid, text = "", quoted, options = {}, smlcap = { smlcap: true }) {
        let isSmlcap = global.db.settings.smlcap && smlcap.smlcap;
        let ephemeral =
          conn.chats[jid]?.metadata?.ephemeralDuration ||
          conn.chats[jid]?.ephemeralDuration ||
          false;
        if (global.db.settings.adReply) {
          let thumb = ["thumb-1", "thumb-2", "thumb-3", "thumb-4", "thumb-5"];
          return Buffer.isBuffer(text)
            ? conn.sendFile(jid, text, "file", "", quoted, false, options)
            : conn.adReply(
                jid,
                text,
                wm,
                "",
                global.thumbnail,
                false,
                quoted,
                false,
                false,
                smlcap
              );
        } else {
          return Buffer.isBuffer(text)
            ? conn.sendFile(jid, text, "file", "", quoted, false, options)
            : conn.sendMessage(
                jid,
                {
                  text: isSmlcap
                    ? conn.smlcap(text, smlcap.except ? smlcap.except : false)
                    : text,
                  ...options,
                },
                { quoted, ...options, ephemeralExpiration: ephemeral }
              );
        }
      },
    },
    adReply: {
      async value(
        jid,
        text,
        title = "",
        body = "",
        buffer,
        source = "",
        quoted,
        large = true,
        options = {},
        smlcap = { smlcap: true }
      ) {
        let isSmlcap = global.db.settings.smlcap && smlcap.smlcap;
        let ephemeral =
          conn.chats[jid]?.metadata?.ephemeralDuration ||
          conn.chats[jid]?.ephemeralDuration ||
          false;
        let { data } = await conn.getFile(buffer, true);
        return conn.sendMessage(
          jid,
          {
            text: isSmlcap
              ? conn.smlcap(text, smlcap.except ? smlcap.except : false)
              : text,
            contextInfo: {
              mentionedJid: await conn.parseMention(text),
              externalAdReply: {
                showAdAttribution: false,
                mediaType: 1,
                title: title,
                body: body,
                thumbnail: data,
                renderLargerThumbnail: large ? true : false,
                mediaUrl: "",
                sourceUrl: source,
              },
            },
          },
          { quoted: quoted, ...options, ephemeralExpiration: ephemeral }
        );
      },
      enumerable: true,
    },
    textList: {
      async value(
        jid,
        text,
        image,
        list = [],
        m,
        options = {},
        smlcap = { smlcap: true }
      ) {
        if (!Array.isArray(list)) {
          list = [];
        }
        let caption = `
${text}

Silahkan Reply/Balas pesan ini dengan Angka ${list[0][1]} - ${list.length} 
${
  options.noList || list.length == 0
    ? ""
    : `
${list
  .map((item, index) => {
    let [command, number, title] = item;
    return `*${number}.* ${title}`.trim();
  })
  .join("\n")}`
}
`.trim();
        let metadata = toSHA256(caption);
        if (image) {
          await conn.sendFile(
            jid,
            image,
            null,
            caption,
            m,
            false,
            options,
            smlcap
          );
        } else {
          await conn.reply(jid, caption, m, options, smlcap);
        }
        global.db.bots.replyText[metadata] = {
          text: caption,
          list: list,
          command: false,
        };
      },
      enumerable: true,
    },
    textOptions: {
      async value(
        jid,
        text,
        image,
        list = [],
        m,
        options = {},
        smlcap = { smlcap: true }
      ) {
        if (!Array.isArray(list)) {
          list = [];
        }
        let caption = `
${text}

Silahkan Reply/Balas pesan ini dengan *${list.length > 0 ? list[0][1] : ""}*${
          list.length > 1 ? ` atau *${list[1][1]}*` : ""
        }
`.trim();
        let metadata = toSHA256(caption);
        if (image) {
          await conn.sendFile(
            jid,
            image,
            null,
            caption,
            m,
            false,
            options,
            smlcap
          );
        } else {
          await conn.reply(jid, caption, m, options, smlcap);
        }
        global.db.bots.replyText[metadata] = {
          text: caption,
          list: list,
          command: false,
        };
      },
      enumerable: true,
    },
    textInput: {
      async value(
        jid,
        text,
        image,
        input,
        m,
        options = {},
        smlcap = { smlcap: true }
      ) {
        let caption = `
${text}
`.trim();
        let metadata = toSHA256(caption);
        if (image) {
          await conn.sendFile(
            jid,
            image,
            null,
            caption,
            m,
            false,
            options,
            smlcap
          );
        } else {
          await conn.reply(jid, caption, m, options, smlcap);
        }
        global.db.bots.replyText[metadata] = {
          text: caption,
          list: false,
          command: input,
        };
      },
      enumerable: true,
    },
    preSudo: {
      async value(text, who, m, chatupdate) {
        let messages = await generateWAMessage(
          m.chat,
          { text, mentions: await conn.parseMention(text) },
          { userJid: who, quoted: m.quoted && m.quoted.fakeObj }
        );
        messages.key.fromMe = baileys.areJidsSameUser(who, conn.user.id);
        messages.key.id = m.key.id;
        messages.pushName = m.pushName;
        if (m.isGroup) messages.key.participant = messages.participant = who;
        let msg = {
          ...chatupdate,
          messages: [proto.WebMessageInfo.fromObject(messages)].map(
            (v) => ((v.conn = this), v)
          ),
          type: "append",
        };
        return msg;
      },
    },
    sendReact: {
      async value(jid, text, key) {
        return conn.sendMessage(jid, { react: { text: text, key: key } });
      },
    },
    msToDate: {
      value(ms) {
        let days = Math.floor(ms / (24 * 60 * 60 * 1000));
        let daysms = ms % (24 * 60 * 60 * 1000);
        let hours = Math.floor(daysms / (60 * 60 * 1000));
        let hoursms = ms % (60 * 60 * 1000);
        let minutes = Math.floor(hoursms / (60 * 1000));
        let minutesms = ms % (60 * 1000);
        let sec = Math.floor(minutesms / 1000);
        return days + " Days " + hours + " Hours " + minutes + " Minutes";
      },
      enumerable: true,
    },
    msToTime: {
      value(ms) {
        let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000);
        let m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60;
        let s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60;
        return [h + " Hours ", m + " Minutes ", s + " Second"]
          .map((v) => v.toString().padStart(2, 0))
          .join(" ");
      },
      enumerable: true,
    },
    msToHour: {
      value(ms) {
        let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000);
        return [h + " Jam "].map((v) => v.toString().padStart(2, 0)).join(" ");
      },
      enumerable: true,
    },
    msToMinute: {
      value(ms) {
        let m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60;
        return [m + " Menit "]
          .map((v) => v.toString().padStart(2, 0))
          .join(" ");
      },
      enumerable: true,
    },
    msToSecond: {
      value(ms) {
        let s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60;
        return [s + " Detik"].map((v) => v.toString().padStart(2, 0)).join(" ");
      },
      enumerable: true,
    },
    clockString: {
      value(ms) {
        let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000);
        let m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60;
        let s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60;
        return [h + " Jam ", m + " Menit ", s + " Detik"]
          .map((v) => v.toString().padStart(2, 0))
          .join(" ");
      },
      enumerable: true,
    },
    sendMsg: {
      async value(jid, message = {}, options = {}) {
        return await conn.sendMessage(jid, message, {
          ...options,
          backgroundColor: "",
          ephemeralExpiration: 86400,
        });
      },
      enumerable: false,
      writable: true,
    },
    sendFThumb: {
      async value(
        jid,
        title,
        text = "",
        thumbnailUrl,
        sourceUrl,
        quoted,
        LargerThumbnail = true,
        AdAttribution = true
      ) {
        return conn.sendMsg(
          jid,
          {
            ...{
              contextInfo: {
                mentionedJid: await conn.parseMention(text),
                externalAdReply: {
                  title: title,
                  body: null,
                  mediaType: 1,
                  previewType: 0,
                  showAdAttribution: AdAttribution,
                  renderLargerThumbnail: LargerThumbnail,
                  thumbnailUrl: thumbnailUrl,
                  sourceUrl: sourceUrl,
                },
              },
            },
            text,
          },
          { quoted }
        );
      },
      enumerable: false,
      writable: true,
    },
    sendFAudio: {
      async value(
        jid,
        audioinfo = {},
        m,
        title,
        thumbnailUrl,
        sourceUrl,
        body = "",
        LargerThumbnail = true,
        AdAttribution = true
      ) {
        return await conn.sendMsg(
          jid,
          {
            ...audioinfo,
            contextInfo: {
              externalAdReply: {
                title: title,
                body: body,
                thumbnailUrl: thumbnailUrl,
                sourceUrl: sourceUrl,
                mediaType: 1,
                showAdAttribution: AdAttribution,
                renderLargerThumbnail: LargerThumbnail,
              },
            },
          },
          { quoted: m }
        );
      },
      enumerable: false,
      writable: true,
    },
  });
  if (conn.user?.id) conn.user.jid = conn.decodeJid(conn.user?.id);
  return conn;
}

const groupCache = new Map();
async function cacheGroupMetadata(conn, jid) {
  if (groupCache.has(jid)) {
    return groupCache.get(jid);
  }
  const metadata = await conn.groupMetadata(jid);
  groupCache.set(jid, metadata);

  setTimeout(() => groupCache.delete(jid), 60000);
  return metadata;
}

async function Serialize(conn, msg) {
  const m = {};
  const botNumber = conn.decodeJid(conn.user?.id);
  if (!msg.message) return;
  if (msg.key && msg.key.remoteJid == "status@broadcast") return;
  m.message = baileys.extractMessageContent(msg.message);
  if (msg.key) {
    m.key = msg.key;
    m.chat = m.key.remoteJid.startsWith("status")
      ? jidNormalizedUser(m.key.participant)
      : jidNormalizedUser(m.key.remoteJid);
    m.fromMe = m.key.fromMe;
    m.id = m.key.id;
    m.isBaileys =
      (m.id?.startsWith("3EB0") && m.id?.length === 22) ||
      m.id?.length === 16 ||
      false;
    m.isGroup = m.chat.endsWith("@g.us");
    m.participant = !m.isGroup ? false : m.key.participant;
    m.sender = conn.decodeJid(
      m.fromMe ? conn.user.id : m.isGroup ? m.participant : m.chat
    );
  }
  m.pushName = msg.pushName;
  m.isOwner =
    m.sender &&
    [...config.owner, botNumber.split("@")[0]].includes(
      m.sender.replace(/\D+/g, "")
    );
  if (m.isGroup) {
    m.metadata = await cacheGroupMetadata(conn, m.chat);
    m.admins = m.metadata.participants.reduce(
      (memberAdmin, memberNow) =>
        (memberNow.admin
          ? memberAdmin.push({ id: memberNow.id, admin: memberNow.admin })
          : [...memberAdmin]) && memberAdmin,
      []
    );
    m.isAdmin = !!m.admins.find((member) => member.id === m.sender);
    m.isBotAdmin = !!m.admins.find((member) => member.id === botNumber);
  }
  if (m.message) {
    m.type = conn.getContentType(m.message) || Object.keys(m.message)[0];
    m.msg =
      baileys.extractMessageContent(m.message[m.type]) || m.message[m.type];
    m.mentions = m.msg?.contextInfo?.mentionedJid || [];
    m.body =
      m.msg?.text ||
      m.msg?.conversation ||
      m.msg?.caption ||
      m.message?.conversation ||
      m.msg?.selectedButtonId ||
      m.msg?.singleSelectReply?.selectedRowId ||
      m.msg?.selectedId ||
      m.msg?.contentText ||
      m.msg?.selectedDisplayText ||
      m.msg?.title ||
      m.msg?.name ||
      "";
    // respon btn
    if (m.type === "interactiveResponseMessage") {
      let msg = m.message[m.type] || m.msg;
      if (msg.nativeFlowResponseMessage && !m.isBot) {
        let { id } = JSON.parse(msg.nativeFlowResponseMessage.paramsJson) || {};
        if (id) {
          let emit_msg = {
            key: {
              ...m.key,
            },
            message: {
              extendedTextMessage: {
                text: id,
              },
            },
            pushName: m.pushName,
            messageTimestamp: m.messageTimestamp || 754785898978,
          };
          return conn.ev.emit("messages.upsert", {
            messages: [emit_msg],
            type: "notify",
          });
        }
      }
    }
    m.prefix = /^[°•π÷×¶∆£¢€¥®™+✓_|~!?@#%^&.©^]/gi.test(m.body)
      ? m.body.match(/^[°•π÷×¶∆£¢€¥®™+✓_|~!?@#%^&.©^]/gi)[0]
      : ".";
    m.command =
      m.body && m.body.replace(m.prefix, "").trim().split(/ +/).shift();
    m.arg =
      m.body
        .trim()
        .split(/ +/)
        .filter((a) => a) || [];
    m.args =
      m.body
        .trim()
        .replace(new RegExp("^" + Function.escapeRegExp(m.prefix), "i"), "")
        .replace(m.command, "")
        .split(/ +/)
        .filter((a) => a) || [];
    m.text = m.args.join(" ");
    m.expiration = m.msg?.contextInfo?.expiration || 0;
    m.timestamp =
      (typeof msg.messageTimestamp === "number"
        ? msg.messageTimestamp
        : msg.messageTimestamp.low
        ? msg.messageTimestamp.low
        : msg.messageTimestamp.high) || m.msg.timestampMs * 1000;
    m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;
    if (m.isMedia) {
      m.mime = m.msg?.mimetype;
      m.size = m.msg?.fileLength;
      m.height = m.msg?.height || "";
      m.width = m.msg?.width || "";
      if (/webp/i.test(m.mime)) {
        m.isAnimated = m.msg?.isAnimated;
      }
    }
    m.reply = async (text, options = {}) => {
      let chatId = options?.from ? options.from : m.chat;
      let quoted = options?.quoted ? options.quoted : m;
      if (
        Buffer.isBuffer(text) ||
        /^data:.?\/.*?;base64,/i.test(text) ||
        /^https?:\/\//.test(text) ||
        fs.existsSync(text)
      ) {
        let data = await Function.getFile(text);
        if (
          !options.mimetype &&
          (/utf-8|json/i.test(data.mime) || data.ext == ".bin" || !data.ext)
        ) {
          return conn.sendMessage(
            chatId,
            {
              text,
              mentions: [m.sender, ...conn.parseMention(text)],
              ...options,
            },
            { quoted, ephemeralExpiration: m.expiration, ...options }
          );
        } else {
          return conn.sendMedia(m.chat, data.data, quoted, {
            ephemeralExpiration: m.expiration,
            ...options,
          });
        }
      } else {
        if (!!config.msg[text]) text = config.msg[text];
        return conn.sendMessage(
          chatId,
          {
            text,
            mentions: [m.sender, ...conn.parseMention(text)],
            ...options,
          },
          { quoted, ephemeralExpiration: m.expiration, ...options }
        );
      }
    };
    m.download = (filepath) => {
      if (filepath) return conn.downloadMediaMessage(m, filepath);
      else return conn.downloadMediaMessage(m);
    };
  }
  // quoted line
  m.isQuoted = false;
  if (m.msg?.contextInfo?.quotedMessage) {
    m.isQuoted = true;
    m.quoted = {};
    m.quoted.message = baileys.extractMessageContent(
      m.msg?.contextInfo?.quotedMessage
    );
    if (m.quoted.message) {
      m.quoted.type =
        conn.getContentType(m.quoted.message) ||
        Object.keys(m.quoted.message)[0];
      m.quoted.msg =
        baileys.extractMessageContent(m.quoted.message[m.quoted.type]) ||
        m.quoted.message[m.quoted.type];
      m.quoted.key = {
        remoteJid: m.msg?.contextInfo?.remoteJid || m.chat,
        participant: m.msg?.contextInfo?.remoteJid?.endsWith("g.us")
          ? conn.decodeJid(m.msg?.contextInfo?.participant)
          : false,
        fromMe: baileys.areJidsSameUser(
          conn.decodeJid(m.msg?.contextInfo?.participant),
          conn.decodeJid(conn.user?.id)
        ),
        id: m.msg?.contextInfo?.stanzaId,
      };
      m.quoted.from = m.quoted.key.remoteJid;
      m.quoted.fromMe = m.quoted.key.fromMe;
      m.quoted.id = m.msg?.contextInfo?.stanzaId;
      m.quoted.isBaileys =
        (m.quoted?.id?.startsWith("3EB0") && m.quoted?.id?.length === 22) ||
        m.quoted?.id?.length === 16 ||
        false;
      m.quoted.isGroup = m.quoted.from.endsWith("@g.us");
      m.quoted.participant = m.quoted.key.participant;
      m.quoted.sender = conn.decodeJid(m.msg?.contextInfo?.participant);
      m.quoted.isOwner =
        m.quoted.sender &&
        [...config.owner, botNumber.split("@")[0]].includes(
          m.quoted.sender.replace(/\D+/g, "")
        );
      if (m.quoted.isGroup) {
        m.quoted.metadata = await cacheGroupMetadata(conn, m.quoted.from);
        m.quoted.admins = m.quoted.metadata.participants.reduce(
          (memberAdmin, memberNow) =>
            (memberNow.admin
              ? memberAdmin.push({ id: memberNow.id, admin: memberNow.admin })
              : [...memberAdmin]) && memberAdmin,
          []
        );
        m.quoted.isAdmin = !!m.quoted.admins.find(
          (member) => member.id === m.quoted.sender
        );
        m.quoted.isBotAdmin = !!m.quoted.admins.find(
          (member) => member.id === botNumber
        );
      }
      m.quoted.mentions = m.quoted.msg?.contextInfo?.mentionedJid || [];
      m.quoted.body =
        m.quoted.msg?.text ||
        m.quoted.msg?.caption ||
        m.quoted?.message?.conversation ||
        m.quoted.msg?.selectedButtonId ||
        m.quoted.msg?.singleSelectReply?.selectedRowId ||
        m.quoted.msg?.selectedId ||
        m.quoted.msg?.contentText ||
        m.quoted.msg?.selectedDisplayText ||
        m.quoted.msg?.title ||
        m.quoted?.msg?.name ||
        "";
      m.quoted.prefix = /^[°•π÷×¶∆£¢€¥®™+✓_|~!?@#%^&.©^]/gi.test(m.quoted.body)
        ? m.quoted.body.match(/^[°•π÷×¶∆£¢€¥®™+✓_|~!?@#%^&.©^]/gi)[0]
        : ".";
      m.quoted.command =
        m.quoted.body &&
        m.quoted.body.replace(m.quoted.prefix, "").trim().split(/ +/).shift();
      m.quoted.arg =
        m.quoted.body
          .trim()
          .split(/ +/)
          .filter((a) => a) || [];
      m.quoted.args =
        m.quoted.body
          .trim()
          .replace(
            new RegExp("^" + Function.escapeRegExp(m.quoted.prefix), "i"),
            ""
          )
          .replace(m.quoted.command, "")
          .split(/ +/)
          .filter((a) => a) || [];
      m.quoted.text = m.quoted.args.join(" ");
      m.quoted.isMedia =
        !!m.quoted.msg?.mimetype || !!m.quoted.msg?.thumbnailDirectPath;
      if (m.quoted.isMedia) {
        m.quoted.mime = m.quoted.msg?.mimetype;
        m.quoted.size = m.quoted.msg?.fileLength;
        m.quoted.height = m.quoted.msg?.height || "";
        m.quoted.width = m.quoted.msg?.width || "";
        if (/webp/i.test(m.quoted.mime)) {
          m.quoted.isAnimated = m?.quoted?.msg?.isAnimated || false;
        }
      }
      m.quoted.reply = (text, options = {}) => {
        return m.reply(text, { quoted: m.quoted, ...options });
      };
      m.quoted.download = (filepath) => {
        if (filepath) return conn.downloadMediaMessage(m.quoted, filepath);
        else return conn.downloadMediaMessage(m.quoted);
      };
    }
  }
  m.react = (emoji) =>
    conn.sendMessage(m.chat, {
      react: {
        text: String(emoji),
        key: m.key,
      },
    });
  m.replyUpdate = (text, cb) => {
    return new Promise(async (resolve) => {
      const response = await conn.sendMessage(
        m.chat,
        {
          text: String(text),
          mentions: await conn.parseMention(text),
        },
        { quoted: m }
      );
      if (typeof cb === "function") {
        /**
         * @param {string} n_text - The new text to update the message.
         * @returns {void}
         */
        cb(async (n_text) => {
          await conn.sendMessage(m.chat, {
            text: String(n_text),
            edit: response.key,
            mentions: await conn.parseMention(n_text),
          });
          resolve();
        });
      }
      resolve();
    });
  };
  return m;
}
function protoType() {
  Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
    const ab = new ArrayBuffer(this.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < this.length; ++i) {
      view[i] = this[i];
    }
    return ab;
  };
  Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
    return this.buffer.slice(
      this.byteOffset,
      this.byteOffset + this.byteLength
    );
  };
  ArrayBuffer.prototype.toBuffer = function toBuffer() {
    return Buffer.from(new Uint8Array(this));
  };
  Uint8Array.prototype.getFileType =
    ArrayBuffer.prototype.getFileType =
    Buffer.prototype.getFileType =
      async function getFileType() {
        return await fileTypeFromBuffer(this);
      };
  String.prototype.isNumber = Number.prototype.isNumber = isNumber;
  String.prototype.capitalize = function capitalize() {
    return this.charAt(0).toUpperCase() + this.slice(1, this.length);
  };
  String.prototype.capitalizeV2 = function capitalizeV2() {
    const str = this.split(" ");
    return str.map((v) => v.capitalize()).join(" ");
  };
  String.prototype.decodeJid = function decodeJid() {
    if (/:\d+@/gi.test(this)) {
      const decode = baileys.jidDecode(this) || {};
      return (
        (decode.user && decode.server && decode.user + "@" + decode.server) ||
        this
      ).trim();
    } else return this.trim();
  };
  Number.prototype.toTimeString = function toTimeString() {
    const seconds = Math.floor((this / 1000) % 60);
    const minutes = Math.floor((this / (60 * 1000)) % 60);
    const hours = Math.floor((this / (60 * 60 * 1000)) % 24);
    const days = Math.floor(this / (24 * 60 * 60 * 1000));
    return (
      (days ? `${days} day(s) ` : "") +
      (hours ? `${hours} hour(s) ` : "") +
      (minutes ? `${minutes} minute(s) ` : "") +
      (seconds ? `${seconds} second(s)` : "")
    ).trim();
  };
  Number.prototype.getRandom =
    String.prototype.getRandom =
    Array.prototype.getRandom =
      getRandom;
}
function isNumber() {
  const int = parseInt(this);
  return typeof int === "number" && !isNaN(int);
}
function getRandom() {
  if (Array.isArray(this) || this instanceof String)
    return this[Math.floor(Math.random() * this.length)];
  return Math.floor(Math.random() * this);
}
export { Client };
export { protoType };
export { Serialize };
export default {
  Client,
  protoType,
  Serialize,
};
