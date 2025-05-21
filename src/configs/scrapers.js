import config from "./config.js";
import fs, { existsSync, watch } from "fs";
import { join, resolve } from "path";
import * as os from "os";
import syntaxerror from "syntax-error";
import { createRequire } from "module";
import path from "path";
import Helper from "./helper.js";

const __dirname = Helper.__dirname(import.meta);
const rootDirectory = Helper.__dirname(join(__dirname, "../"));
const scraperFolder = Helper.__dirname(
  join(__dirname, "../" + config.scrapers),
);
const scraperFilter = (filename) => /\.(js|mjs|cjs)$/.test(filename);
const require = createRequire(import.meta.url);

async function importFile(module) {
  module = Helper.__filename(module);

  const ext = path.extname(module);
  let result;

  if (ext === ".cjs") {
    const module_ = require(module);
    result = module_ && module_.default ? module_.default : module_;
  } else {
    const module_ = await import(`${module}?id=${Date.now()}`);
    result = module_ && module_.default ? module_.default : module_;
  }

  return result;
}

let watcher = {};
let scrapers = {};
let scraperFolders = [];
/**
 * Load files from scraper folder as scrapers
 */
async function loadScraperFiles(
  scraperFolder,
  scraperFilter,
  opts = { recursiveRead: false },
) {
  const folder = resolve(scraperFolder);
  if (folder in watcher) return;
  scraperFolders.push(folder);
  const paths = await fs.promises.readdir(scraperFolder);
  await Promise.all(
    paths.map(async (path) => {
      const resolved = join(folder, path);
      const dirname = resolved;
      const formattedFilename = formatFilename(resolved);
      try {
        const stats = await fs.promises.lstat(dirname);
        if (!stats.isFile()) {
          if (opts.recursiveRead)
            await loadScraperFiles(dirname, scraperFilter, opts);
          return;
        }
        const filename = resolved;
        const isValidFile = scraperFilter(filename);
        if (!isValidFile) return;
        const module = await importFile(filename);
        if (module) scrapers[formattedFilename] = module;
      } catch (e) {
        opts.logger?.error(e, `error while requiring ${formattedFilename}`);
        delete scrapers[formattedFilename];
      }
    }),
  );
  const watching = watch(
    folder,
    reload.bind(null, {
      logger: opts.logger,
      scraperFolder,
      scraperFilter,
    }),
  );
  watching.on("close", () => deleteScraperFolder(folder, true));
  watcher[folder] = watching;
  return (scrapers = sortedScrapers(scrapers));
}
/**
 * Delete and stop watching the folder
 */
function deleteScraperFolder(folder, isAlreadyClosed = false) {
  const resolved = resolve(folder);
  if (!(resolved in watcher)) return;
  if (!isAlreadyClosed) watcher[resolved].close();
  delete watcher[resolved];
  scraperFolders.splice(scraperFolders.indexOf(resolved), 1);
}
/**
 * Reload file to load latest changes
 */
async function reload(
  { logger, scraperFolder = scraperFolder, scraperFilter = scraperFilter },
  _ev,
  filename,
) {
  if (scraperFilter(filename)) {
    const file = join(scraperFolder, filename);
    const formattedFilename = formatFilename(file);
    if (formattedFilename in scrapers) {
      if (existsSync(file))
        logger?.info(`updated scraper - '${formattedFilename}'`);
      else {
        logger?.warn(`deleted scraper - '${formattedFilename}'`);
        return delete scrapers[formattedFilename];
      }
    } else logger?.info(`new scraper - '${formattedFilename}'`);
    const src = await fs.promises.readFile(file);
    let err = syntaxerror(src, filename, {
      sourceType: "module",
      allowAwaitOutsideFunction: true,
    });
    if (err)
      logger?.error(err, `syntax error while loading '${formattedFilename}'`);
    else
      try {
        const module = await importFile(file);
        if (module) scrapers[formattedFilename] = module;
      } catch (e) {
        logger?.error(e, `error require scraper '${formattedFilename}'`);
        delete scrapers[formattedFilename];
      } finally {
        scrapers = sortedScrapers(scrapers);
      }
  }
}
/**
 * Format filename to a relative path
 */
function formatFilename(filename) {
  return path.basename(filename, path.extname(filename)); // Mengembalikan hanya nama file tanpa path dan ekstensi
}
/**
 * Sort scrapers by their keys
 */
function sortedScrapers(scrapers) {
  return Object.fromEntries(
    Object.entries(scrapers).sort(([a], [b]) => a.localeCompare(b)),
  );
}
export { scraperFolder };
export { scraperFilter };
export { scrapers };
export { watcher };
export { scraperFolders };
export { loadScraperFiles };
export { deleteScraperFolder };
export { reload };
export default {
  scraperFolder,
  scraperFilter,
  scrapers,
  watcher,
  scraperFolders,
  loadScraperFiles,
  deleteScraperFolder,
  reload,
};