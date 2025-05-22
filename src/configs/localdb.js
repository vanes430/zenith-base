/**
 * Database loader utility for WhatsApp bot
 * Handles initialization and validation of user, group, and settings data
 */

// Type checking utilities
const validators = {
  isNumber: (x) => typeof x === "number" && !isNaN(x),
  isBoolean: (x) => typeof x === "boolean",
  isString: (x) => typeof x === "string",
  isObject: (x) => typeof x === "object" && x !== null,
  isArray: (x) => Array.isArray(x),
};

/**
 * Initialize default user data
 * @param {Object} m Message object containing sender info
 * @returns {Object} Default user object
 */
const getDefaultUser = (m) => ({
  lastChat: new Date().getTime(),
  premium: m.isOwner ? true : false,
  VIP: m.isOwner ? true : false,
  name: m.pushName || "Unknown",
  banned: false,
  level: 1,
  exp: 0,
  limit: 10,
  warning: 0,
  lastDaily: 0,
});

/**
 * Initialize default group data
 * @returns {Object} Default group object
 */
const getDefaultGroup = () => ({
  lastChat: new Date().getTime(),
  mute: false,
  welcome: true,
  leave: true,
  antilink: false,
  antispam: false,
  notification: true,
  moderation: {
    enabled: false,
    filters: [],
  },
});

/**
 * Initialize default settings
 * @returns {Object} Default settings object
 */
const getDefaultSettings = () => ({
  firstchat: true,
  readstory: true,
  reactstory: false,
  autoread: false,
  self: false,
  smlcap: false,
  adReply: false,
  topup: [],
  ch_id: "120363404922144807@newsletter",
  ch_name: "vanes430 Ch.",
  logo: "",
  developer: "vanes430",
  packname: "https://github.com/vanes430",
  api: {},
  limit: {
    free: 10,
    premium: 100,
    reset: "00:00",
  },
  maintenance: false,
  backup: {
    enabled: false,
    interval: 24, // hours
  },
});

/**
 * Initialize default bot data
 * @returns {Object} Default bot object
 */
const getDefaultBot = () => ({
  replyText: {},
  rating: {},
  menfess: {},
  anonymous: {},
});

/**
 * Load and validate database entries
 * @param {Object} m Message object
 */
function loadDatabase(m) {
  if (!global.db) global.db = {};
  if (!global.db.users) global.db.users = {};
  if (!global.db.groups) global.db.groups = {};
  if (!global.db.settings) global.db.settings = {};
  if (!global.db.bots) global.db.bots = {};

  let user = global.db.users[m.sender];
  if (!validators.isObject(user)) {
    global.db.users[m.sender] = getDefaultUser(m);
  } else {
    const defaultUser = getDefaultUser(m);
    for (const [key, value] of Object.entries(defaultUser)) {
      if (!(key in user) || typeof user[key] !== typeof value) {
        user[key] = value;
      }
    }
  }

  if (m.isGroup) {
    let group = global.db.groups[m.chat];
    if (!validators.isObject(group)) {
      global.db.groups[m.chat] = getDefaultGroup();
    } else {
      const defaultGroup = getDefaultGroup();
      for (const [key, value] of Object.entries(defaultGroup)) {
        if (!(key in group) || typeof group[key] !== typeof value) {
          group[key] = value;
        }
      }
    }
  }

  let settings = global.db.settings;
  if (!validators.isObject(settings)) {
    global.db.settings = getDefaultSettings();
  } else {
    const defaultSettings = getDefaultSettings();
    for (const [key, value] of Object.entries(defaultSettings)) {
      if (!(key in settings) || typeof settings[key] !== typeof value) {
        settings[key] = value;
      }
    }
  }

  let bots = global.db.bots;
  if (!validators.isObject(bots)) {
    global.db.bots = getDefaultBot();
  } else {
    const defaultBot = getDefaultBot();
    for (const [key, value] of Object.entries(defaultBot)) {
      if (!(key in bots) || typeof bots[key] !== typeof value) {
        bots[key] = value;
      }
    }
  }
}

export { loadDatabase };
export default {
  loadDatabase,
};
