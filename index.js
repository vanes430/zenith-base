import config from "./src/configs/config.js";
import baileys from "baileys";
import { createClient, getWAVersion } from "./src/lib/client.js";
import fs from "fs";

import {
  plugins,
  loadPluginFiles,
  pluginFolder,
  pluginFilter,
} from "./src/configs/plugins.js";
import { loadScraperFiles, scraperFolder, scraperFilter } from "./src/configs/scrapers.js";
import groupEvents from "./src/events/groups.js";
import messageHandler from "./src/events/messages.js";
import connectionUpdate from "./src/events/connection.js";
import Database from "./src/configs/database.js";
import { PhoneNumber } from "libphonenumber-js";

const { delay, jidNormalizedUser } = baileys;
const code = config.code
const pairingCode = config.pairingNumber;
const pathContacts = `./${config.session}/contacts.json`;
const pathMetadata = `./${config.session}/groupMetadata.json`;

async function WAStart() {
  process.on("uncaughtException", console.error);
  process.on("unhandledRejection", console.error);

  const { version, isLatest } = await getWAVersion();
  console.log(`Menggunakan WA v${version.join(".")}, isLatest: ${isLatest}`);

  const { client, saveCreds, store } = await createClient({
    session: config.session,
  });

  const database = new Database();
  const content = await database.read();
  
  if (!content || Object.keys(content).length === 0) {
    global.db = {
      users: {},
      groups: {},
      settings: {},
      ...(content || {}),
    };

    await database.write(global.db);
    client.logger.info("Database has been initialized successfully.");
  } else {
    global.db = content;
    client.logger.info("Database loaded successfully.");
  }

  if (pairingCode && !client.authState.creds.registered) {
    const isValidCode = /^[A-Z0-9]{8}$/.test(code);
      if (isValidCode) {
        await delay(3000);
        await client.requestPairingCode(pairingCode, code);
        console.log(`⚠︎ Kode WhatsApp kamu: ${code}`);
      } else {
        console.log("Gagal melakukan authentikasi \nCode Pair Tidak Tepat"); // Menghentikan eksekusi
        process.exit(1);
      }
  }

  try {
    await loadPluginFiles(pluginFolder, pluginFilter, {
      logger: client.logger,
      recursiveRead: true,
    })
      .then((plugins) => client.logger.info("Plugins Loader Success!"))
      .catch(console.error);

    await loadScraperFiles(scraperFolder, scraperFilter, {
    	logger: client.logger,
    	recursiveRead: true,
    })
      .then((plugins) => client.logger.info("Scraper Loader Success!"))
      .catch(client.logger.error);
  } catch (error) {
    client.logger.error("Error:", error.message);
  }

  connectionUpdate(client, WAStart);
  groupEvents(client, store);
  messageHandler(client, store);

  client.ev.on("creds.update", saveCreds);

  setInterval(async () => {
    if (store.groupMetadata) {
      fs.writeFileSync(pathMetadata, JSON.stringify(store.groupMetadata));
    }
    if (store.contacts) {
      fs.writeFileSync(pathContacts, JSON.stringify(store.contacts));
    }
    if (config.writeStore) {
      store.writeToFile(`./${config.session}/store.json`);
    }
    if (global.db) {
      await database.write(global.db);
    }
  }, 30 * 1000);
}

WAStart();
