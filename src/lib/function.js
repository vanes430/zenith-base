import fs from "fs";
import path from "path";
import Jimp from "jimp";
import axios from "axios";
import chalk from "chalk";
import * as cheerio from "cheerio";
import * as mimes from "mime-types";
import FormData from "form-data";
import * as moment from "moment-timezone";
import baileys from "baileys";
import { format } from "util";
import { platform } from "os";
import { exec } from "child_process";
import { fileTypeFromBuffer } from "file-type";
import { fileURLToPath, pathToFileURL } from "url";

export default new (class Function {
  constructor() {
    this.axios = axios;
    this.cheerio = cheerio;
    this.fs = fs;
    this.path = path;
    this.baileys = baileys;
    this.FormData = FormData;
    this.upload = {
      arcdn: this.arcdn.bind(this),
      telegra: this.telegra.bind(this),
      pomf: this.pomf.bind(this),
      hari: this.hari.bind(this),
      tmp: this.tmp.bind(this),
      freeimage: this.freeimage.bind(this),
    };
  }
  /* Text Style
   * @param {String} type
   * @param {String} text
   */
  texted = (type, text) => {
    switch (type) {
      case "bold":
        return "*" + text + "*";
        break;
      case "italic":
        return "_" + text + "_";
        break;
      case "monospace":
        return "```" + text + "```";
    }
  };
  /* Example Format
   * @param {String} isPrefix
   * @param {String} command
   * @param {String} args
   */
  example = (isPrefix, command, args) => {
    return `• ${this.texted("bold", "Example")} : ${isPrefix + command} ${args}`;
  };
  /* Random Filename
   * @param {String} extension
   */
  filename = (extension) => {
    return `${Math.floor(Math.random() * 10000)}.${extension}`;
  };
  /* Create UUID */
  uuid = () => {
    var dt = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        var y = Math.floor(dt / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
      },
    );
    return uuid;
  };
  /* Random Element From Array
   * @param {Array} list
   */
  random = (list) => {
    return list[Math.floor(Math.random() * list.length)];
  };
  /* Random Number
   * @param {Integer} min
   * @param {Integer} max
   */
  randomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  /* Format Number \w Dot
   * @param {Integer} integer
   */
  formatter = (integer) => {
    let numb = parseInt(integer);
    return Number(numb).toLocaleString().replace(/,/g, ".");
  };
  formatNumber = (integer) => {
    let numb = parseInt(integer);
    return Number(numb).toLocaleString().replace(/,/g, ".");
  };
  /* H2K Format
   * @param {Integer} integer
   */
  h2k = (integer) => {
    let numb = parseInt(integer);
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
    }).format(numb);
  };
  /* To Readable Size
   * @param {Integer} size
   */
  formatSize = (size) => {
    function round(value, precision) {
      var multiplier = Math.pow(10, precision || 0);
      return Math.round(value * multiplier) / multiplier;
    }
    var megaByte = 1024 * 1024;
    var gigaByte = 1024 * megaByte;
    var teraByte = 1024 * gigaByte;
    if (size < 1024) {
      return size + " B";
    } else if (size < megaByte) {
      return round(size / 1024, 1) + " KB";
    } else if (size < gigaByte) {
      return round(size / megaByte, 1) + " MB";
    } else if (size < teraByte) {
      return round(size / gigaByte, 1) + " GB";
    } else {
      return round(size / teraByte, 1) + " TB";
    }
    return "";
  };
  /* Fix Instagram URL
   * @param {String|Integer} str
   */
  getSize = async (str) => {
    if (!isNaN(str)) return this.formatSize(str);
    let header = await (await axios.get(str)).headers;
    return this.formatSize(header["content-length"]);
  };
  async dirSize(directory) {
    const files = await fs.readdirSync(directory);
    const stats = files.map((file) => fs.statSync(path.join(directory, file)));
    return (await Promise.all(stats)).reduce(
      (accumulator, { size }) => accumulator + size,
      0,
    );
  }
  sleep(ms) {
    return new Promise((a) => setTimeout(a, ms));
  }
  format(str) {
    return format(str);
  }
  Format(str) {
    return JSON.stringify(str, null, 2);
  }
  toDollar(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x)) x = x.replace(pattern, "$1.$2");
    return "$" + x;
  }
  jam(numer, options = {}) {
    let format = options.format ? options.format : "HH:mm";
    let jam = options?.timeZone
      ? moment(numer).tz(options.timeZone).format(format)
      : moment(numer).format(format);
    return `${jam}`;
  }
  tanggal(numer, timeZone = "") {
    const myMonths = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const myDays = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jum’at",
      "Sabtu",
    ];
    var tgl = new Date(numer);
    timeZone ? tgl.toLocaleString("en", { timeZone }) : "";
    var day = tgl.getDate();
    var bulan = tgl.getMonth();
    var thisDay = tgl.getDay(),
      thisDay = myDays[thisDay];
    var yy = tgl.getYear();
    var year = yy < 1000 ? yy + 1900 : yy;
    return `${thisDay}, ${day} ${myMonths[bulan]} ${year}`;
  }
  async getFile(PATH, save) {
    try {
      let filename = null;
      let data = await this.fetchBuffer(PATH);
      if (data?.data && save) {
        filename = path.join(
          process.cwd(),
          "storage/tmp",
          Date.now() + "." + data.ext,
        );
        fs.promises.writeFile(filename, data?.data);
      }
      return {
        filename: data?.name ? data.name : filename,
        ...data,
      };
    } catch (e) {
      throw e;
    }
  }
  async fetchJson(url, options = {}) {
    try {
      let data = await axios.get(url, {
        headers: {
          ...(!!options.headers ? options.headers : {}),
        },
        responseType: "json",
        ...options,
      });
      return await data?.data;
    } catch (e) {
      throw e;
    }
  }
  fetchBuffer(string, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        if (/^https?:\/\//i.test(string)) {
          let data = await axios.get(string, {
            headers: {
              ...(!!options.headers ? options.headers : {}),
            },
            responseType: "arraybuffer",
            ...options,
          });
          let buffer = await data?.data;
          let name = /filename/i.test(data.headers?.get("content-disposition"))
            ? data.headers
                ?.get("content-disposition")
                ?.match(/filename=(.*)/)?.[1]
                ?.replace(/[""]/g, "")
            : "";
          let mime =
            mimes.lookup(name) ||
            data.headers.get("content-type") ||
            (await fileTypeFromBuffer(buffer))?.mime;
          resolve({
            data: buffer,
            size: Buffer.byteLength(buffer),
            sizeH: this.formatSize(Buffer.byteLength(buffer)),
            name,
            mime,
            ext: mimes.extension(mime),
          });
        } else if (/^data:.*?\/.*?base64,/i.test(string)) {
          let data = Buffer.from(string.split`,`[1], "base64");
          let size = Buffer.byteLength(data);
          resolve({
            data,
            size,
            sizeH: this.formatSize(size),
            ...((await fileTypeFromBuffer(data)) || {
              mime: "application/octet-stream",
              ext: ".bin",
            }),
          });
        } else if (fs.existsSync(string) && fs.statSync(string).isFile()) {
          let data = fs.readFileSync(string);
          let size = Buffer.byteLength(data);
          resolve({
            data,
            size,
            sizeH: this.formatSize(size),
            ...((await fileTypeFromBuffer(data)) || {
              mime: "application/octet-stream",
              ext: ".bin",
            }),
          });
        } else if (Buffer.isBuffer(string)) {
          let size = Buffer?.byteLength(string) || 0;
          resolve({
            data: string,
            size,
            sizeH: this.formatSize(size),
            ...((await fileTypeFromBuffer(string)) || {
              mime: "application/octet-stream",
              ext: ".bin",
            }),
          });
        } else if (/^[a-zA-Z0-9+/]={0,2}$/i.test(string)) {
          let data = Buffer.from(string, "base64");
          let size = Buffer.byteLength(data);
          resolve({
            data,
            size,
            sizeH: this.formatSize(size),
            ...((await fileTypeFromBuffer(data)) || {
              mime: "application/octet-stream",
              ext: ".bin",
            }),
          });
        } else {
          let buffer = Buffer.alloc(20);
          let size = Buffer.byteLength(buffer);
          resolve({
            data: buffer,
            size,
            sizeH: this.formatSize(size),
            ...((await fileTypeFromBuffer(buffer)) || {
              mime: "application/octet-stream",
              ext: ".bin",
            }),
          });
        }
      } catch (e) {
        reject(new Error(e?.message || e));
      }
    });
  }
  mime(name) {
    let mimetype = mimes.lookup(name);
    if (!mimetype) return mimes.extension(name);
    return { mime: mimetype, ext: mimes.extension(mimetype) };
  }
  isUrl(url) {
    let regex = new RegExp(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      "gi",
    );
    if (!regex.test(url)) return false;
    return url.match(regex);
  }
  escapeRegExp(string) {
    return string.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, "\\$&");
  }
  toUpper(query) {
    const arr = query.split(" ");
    for (var i = 0; i < arr.length; i++) {
      arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
    }
    return arr.join(" ");
  }
  getRandom(ext = "", length = "10") {
    var result = "";
    var character =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    var characterLength = character.length;
    for (var i = 0; i < length; i++) {
      result += character.charAt(Math.floor(Math.random() * characterLength));
    }
    return `${result}${ext ? `.${ext}` : ""}`;
  }
  pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
  formatSize(bytes, si = true, dp = 2) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
      return `${bytes} B`;
    }
    const units = si
      ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
      : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    const r = 10 ** dp;
    let u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (
      Math.round(Math.abs(bytes) * r) / r >= thresh &&
      u < units.length - 1
    );
    return `${bytes.toFixed(dp)} ${units[u]}`;
  }
  async resizeImage(buffer, height) {
    buffer = (await this.getFile(buffer)).data;
    return new Promise((resolve, reject) => {
      Jimp.read(buffer, (err, image) => {
        if (err) {
          reject(err);
          return;
        }
        image
          .resize(Jimp.AUTO, height)
          .getBuffer(Jimp.MIME_PNG, (err, resizedBuffer) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(resizedBuffer);
          });
      });
    });
  }
  runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor((seconds % (3600 * 24)) / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
  }
  reloadPlugin(type, file) {
    const filename = (file) => file.replace(/^.*[\\\/]/, "");
    switch (type) {
      case "delete":
        return delete global.plugins[file];
        break;
      case "add":
      case "change":
        try {
          (async () => {
            const module = await import(`${file}?update=${Date.now()}`);
            global.plugins[file] = module.default || module;
          })();
        } catch (e) {
          conn.logger.error(
            `Error require plugin "${filename(file)}\n${format(e)}"`,
          );
        } finally {
          global.plugins = Object.fromEntries(
            Object.entries(global.plugins).sort(([a], [b]) =>
              a.localeCompare(b),
            ),
          );
        }
        break;
    }
  }
  timeSpeech() {
    let ucapanWaktu = "";
    let wakt = moment.tz("Asia/Jakarta").format("HH:mm");
    if (wakt < "23:59") ucapanWaktu = "Selamat Malam";
    if (wakt < "19:00") ucapanWaktu = "Selamat Petang";
    if (wakt < "18:00") ucapanWaktu = "Selamat Sore";
    if (wakt < "15:00") ucapanWaktu = "Selamat Siang";
    if (wakt < "10:00") ucapanWaktu = "Selamat Pagi";
    if (wakt < "05:00") ucapanWaktu = "Selamat Subuh";
    if (wakt < "03:00") ucapanWaktu = "Selamat Tengah Malam";
    return ucapanWaktu;
  }
  arcdn(media) {
    return new Promise(async (resolve, reject) => {
      let mime = await fileTypeFromBuffer(media);
      let form = new FormData();
      form.append("file", media, `file-${Date.now()}.${mime.ext}`);
      axios
        .post("https://cdn.arifzyn.tech/api/upload", form, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
            ...form.getHeaders(),
          },
        })
        .then(({ data }) => resolve(data))
        .catch(reject);
    });
  }
  pomf(media) {
    return new Promise(async (resolve, reject) => {
      let mime = await fileTypeFromBuffer(media);
      let form = new FormData();
      form.append("files[]", media, `file-${Date.now()}.${mime.ext}`);
      axios
        .post("https://pomf.lain.la/upload.php", form, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
            ...form.getHeaders(),
          },
        })
        .then(({ data }) => resolve(data.files[0].url))
        .catch(reject);
    });
  }
  telegra(media) {
    return new Promise(async (resolve, reject) => {
      let mime = await fileTypeFromBuffer(media);
      let form = new FormData();
      form.append("file", media, `file-${Date.now()}.${mime.ext}`);
      axios
        .post("https://telegra.ph/upload", form, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
            ...form.getHeaders(),
          },
        })
        .then(({ data }) => resolve("https://telegra.ph" + data[0].src))
        .catch(reject);
    });
  }
  hari(media) {
    return new Promise(async (resolve, reject) => {
      let mime = await fileTypeFromBuffer(media);
      let form = new FormData();
      form.append("file", media, `file-${Date.now()}.${mime.ext}`);
      axios
        .post("https://hari.christmas/upload", form, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
            ...form.getHeaders(),
          },
        })
        .then(({ data }) => resolve(data.downloadUrl))
        .catch(reject);
    });
  }
  tmp(media) {
    return new Promise(async (resolve, reject) => {
      let mime = await fileTypeFromBuffer(media);
      let form = new FormData();
      form.append("file", media, `file-${Date.now()}.${mime.ext}`);
      axios
        .post("https://tmpfiles.org/api/v1/upload", form, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
            ...form.getHeaders(),
          },
        })
        .then(({ data }) => {
          const url = data.data.url.match(/https:\/\/tmpfiles.org\/(.*)/)[1];
          const hasil = "https://tmpfiles.org/dl/" + url;
          resolve(hasil);
        })
        .catch(reject);
    });
  }
  async freeimage(buffer) {
    const { data: html } = await axios
      .get("https://freeimage.host/")
      .catch(() => null);
    const token = html.match(/PF.obj.config.auth_token = "(.+?)";/)[1];
    let mime = await fileTypeFromBuffer(buffer);
    let form = new FormData();
    form.append("source", buffer, `file-${Date.now()}.${mime.ext}`);
    const options = {
      type: "file",
      action: "upload",
      timestamp: (Date.now() / 1000).toString(),
      auth_token: token,
      nsfw: "0",
    };
    for (const [key, value] of Object.entries(options)) {
      form.append(key, value);
    }
    const { data } = await axios.post("https://freeimage.host/json", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data.image.url;
  }
})();
