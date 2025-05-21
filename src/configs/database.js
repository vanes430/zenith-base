import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import config from "./config.js";
mongoose.set("strictQuery", false);
let Database;
if (/mongo/.test(config.database)) {
  Database = class MongoDB {
    constructor(url) {
      this.url = url;
      this.options = {
        useNewUrlParser: false,
        useUnifiedTopology: false,
      };
      this.connection = this.url || config.database;
      this.model = {
        database: {},
      };
      this.data = {};
    }
    async read() {
      await mongoose.connect(this.connection, this.options);
      try {
        const schemaData = new mongoose.Schema({
          data: {
            type: Object,
            required: true,
            default: {},
          },
        });
        this.model.database = mongoose.model("data", schemaData);
      } catch {
        this.model.database = mongoose.model("data");
      }
      this.data = await this.model.database.findOne({});
      if (!this.data) {
        await new this.model.database({
          data: {},
        }).save();
        this.data = await this.model.database.findOne({});
      }
      return this?.data?.data || this?.data;
    }
    async write(data) {
      const obj = data || global.db;
      if (!this.data || !this.data.data) {
        return await new this.model.database({
          data: obj,
        }).save();
      }
      const document = await this.model.database.findById(this.data._id);
      document.data = obj;
      await document.save();
    }
  };
} else if (/json/.test(config.database)) {
  Database = class Database {
    constructor() {
      this.data = {};
      this.file = path.join(process.cwd(), "temp", config.database);
    }
    read() {
      let data;
      if (fs.existsSync(this.file)) {
        data = JSON.parse(fs.readFileSync(this.file));
      } else {
        fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
        data = this.data;
      }
      return data;
    }
    write(data) {
      this.data = data || global.db;
      const dirname = path.dirname(this.file);
      if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
      return this.file;
    }
  };
}
export default Database;
