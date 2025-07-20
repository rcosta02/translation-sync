// index.js - Main entry point
const fs = require("fs").promises;
const path = require("path");
const chokidar = require("chokidar");
const crypto = require("crypto");

class TranslationSync {
  constructor(options = {}) {
    this.directory = options.directory || "./translations";
    this.sourceLanguage = options.sourceLanguage || "en";
    this.targetLanguages = options.targetLanguages || [];
    this.onTranslationComplete = options.onTranslationComplete || (() => {});
    this.silent = options.silent || false;
    this.verbose = options.verbose || false;
    this.hashFile = path.join(this.directory, ".translation-hashes.json");
    this.hashes = {};
    this.translationService = new GoogleTranslateService();
  }

  log(message, force = false) {
    if (!this.silent || force) {
      console.log(message);
    }
  }

  async init() {
    try {
      // Ensure directory exists
      await fs.mkdir(this.directory, { recursive: true });

      await this.loadHashes();
      this.log("✅ Translation sync initialized");
      this.log(`📁 Watching: ${this.directory}`);
      this.log(`🔤 Source language: ${this.sourceLanguage}`);
      this.log(`🌍 Target languages: ${this.targetLanguages.join(", ")}`);
    } catch (error) {
      console.error("❌ Failed to initialize:", error.message);
      throw error;
    }
  }

  async loadHashes() {
    try {
      const hashData = await fs.readFile(this.hashFile, "utf8");
      this.hashes = JSON.parse(hashData);
    } catch (error) {
      this.hashes = {};
    }
  }

  async saveHashes() {
    await fs.writeFile(this.hashFile, JSON.stringify(this.hashes, null, 2));
  }

  calculateHash(content) {
    return crypto
      .createHash("md5")
      .update(JSON.stringify(content))
      .digest("hex");
  }

  async readTranslationFile(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf8");
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Error reading ${filePath}:`, error.message);
      return {};
    }
  }

  async writeTranslationFile(filePath, content) {
    await fs.writeFile(filePath, JSON.stringify(content, null, 2));
  }

  getLanguageFromFilename(filename) {
    const match = filename.match(/([a-z]{2}(-[A-Z]{2})?)\.json$/);
    return match ? match[1] : null;
  }

  findChangedKeys(oldData, newData, prefix = "") {
    const changes = {};

    for (const [key, value] of Object.entries(newData)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null) {
        const oldValue = oldData[key] || {};
        const nestedChanges = this.findChangedKeys(oldValue, value, fullKey);
        Object.assign(changes, nestedChanges);
      } else if (oldData[key] !== value) {
        changes[fullKey] = value;
      }
    }

    return changes;
  }

  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    let current = obj;

    for (const key of keys) {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  async translateChanges(changes, sourceLang, targetLang) {
    const translations = {};

    for (const [key, value] of Object.entries(changes)) {
      try {
        const translatedValue = await this.translationService.translate(
          value,
          sourceLang,
          targetLang
        );
        translations[key] = translatedValue;
        if (this.verbose) {
          this.log(
            `🔄 ${key}: "${value}" → "${translatedValue}" (${sourceLang} → ${targetLang})`
          );
        }
      } catch (error) {
        console.error(`❌ Failed to translate "${key}":`, error.message);
        translations[key] = value; // Fallback to original value
      }
    }

    return translations;
  }

  async processFileChange(filePath) {
    const filename = path.basename(filePath);
    const language = this.getLanguageFromFilename(filename);

    if (!language) {
      this.log(`⏭️  Skipping non-translation file: ${filename}`);
      return;
    }

    this.log(`\n📝 Processing changes in ${filename}...`);

    const currentData = await this.readTranslationFile(filePath);
    const currentHash = this.calculateHash(currentData);
    const oldHash = this.hashes[filename];

    if (currentHash === oldHash) {
      this.log(`✅ No changes detected in ${filename}`);
      return;
    }

    // If this is not the source language file, skip it
    if (language !== this.sourceLanguage) {
      this.log(`⏭️  Skipping non-source language file: ${filename}`);
      this.hashes[filename] = currentHash;
      await this.saveHashes();
      return;
    }

    // Find what changed
    const oldData = this.hashes[filename]
      ? await this.getOldData(filePath)
      : {};
    const changes = this.findChangedKeys(oldData, currentData);

    if (Object.keys(changes).length === 0) {
      this.log(`✅ No translatable changes in ${filename}`);
      this.hashes[filename] = currentHash;
      await this.saveHashes();
      return;
    }

    this.log(`🔍 Found ${Object.keys(changes).length} changes to translate`);

    // Translate changes to all target languages
    for (const targetLang of this.targetLanguages) {
      if (targetLang === language) continue;

      const targetFilename = filename.replace(
        /[a-z]{2}(-[A-Z]{2})?\.json$/,
        `${targetLang}.json`
      );
      const targetFilePath = path.join(path.dirname(filePath), targetFilename);

      this.log(`\n🌍 Translating to ${targetLang}...`);

      // Load existing target file
      let targetData = {};
      try {
        targetData = await this.readTranslationFile(targetFilePath);
      } catch (error) {
        this.log(`📄 Creating new file: ${targetFilename}`);
      }

      // Translate changes
      const translations = await this.translateChanges(
        changes,
        language,
        targetLang
      );

      // Apply translations to target data
      for (const [key, translatedValue] of Object.entries(translations)) {
        this.setNestedValue(targetData, key, translatedValue);
      }

      // Save updated target file
      await this.writeTranslationFile(targetFilePath, targetData);

      // Update hash for target file
      const targetHash = this.calculateHash(targetData);
      this.hashes[targetFilename] = targetHash;

      this.log(`✅ Updated ${targetFilename}`);
    }

    // Update hash for source file
    this.hashes[filename] = currentHash;
    await this.saveHashes();

    this.log(`\n🎉 Translation sync completed for ${filename}`);

    // Execute callback
    if (this.onTranslationComplete) {
      this.onTranslationComplete(filename, changes);
    }
  }

  async getOldData(filePath) {
    // This is a simplified version - in a real implementation,
    // you might want to store the previous state more reliably
    return {};
  }

  async watch() {
    const watcher = chokidar.watch(`${this.directory}/**/*.json`, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on("change", async (filePath) => {
      try {
        await this.processFileChange(filePath);
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
      }
    });

    watcher.on("add", async (filePath) => {
      this.log(`📁 New translation file detected: ${path.basename(filePath)}`);
    });

    this.log(`👀 Watching for changes in ${this.directory}...`);

    return watcher;
  }

  async checkAndTranslate() {
    this.log("🔍 Checking for translation changes...");

    const files = await fs.readdir(this.directory);
    const jsonFiles = files.filter(
      (file) => file.endsWith(".json") && !file.startsWith(".")
    );

    for (const file of jsonFiles) {
      const filePath = path.join(this.directory, file);
      await this.processFileChange(filePath);
    }

    // Delete the .translation-hashes.json file
    try {
      await fs.unlink(this.hashFile);
      this.log(`🗑️ Deleted hash file: ${this.hashFile}`);
    } catch (error) {
      this.log(`⚠️ Could not delete hash file: ${error.message}`);
    }

    this.log("✅ Check complete");
  }
}

// Free translation service using Google Translate (unofficial)
class GoogleTranslateService {
  async translate(text, from, to) {
    // Using a free translation method via unofficial API
    // In production, you might want to use a more reliable service
    const https = require("https");
    const querystring = require("querystring");

    return new Promise((resolve, reject) => {
      const params = querystring.stringify({
        client: "gtx",
        sl: from,
        tl: to,
        dt: "t",
        q: text,
      });

      const options = {
        hostname: "translate.googleapis.com",
        port: 443,
        path: `/translate_a/single?${params}`,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            const translation = parsed[0][0][0];
            resolve(translation);
          } catch (error) {
            reject(new Error("Failed to parse translation response"));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error("Translation request timeout"));
      });

      req.end();
    });
  }
}

module.exports = TranslationSync;
