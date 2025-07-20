# Translation Sync

🌍 **Automatic translation synchronization for your internationalization files**

Translation Sync is a powerful Node.js package that automatically translates your JSON translation files when changes are detected. It watches your translation directory and keeps all language files synchronized by translating only the changed keys.

## ✨ Features

- 🔄 **Automatic Translation**: Instantly translates changes in your source language files
- 👀 **File Watching**: Real-time monitoring of translation files for changes
- 🎯 **Smart Updates**: Only translates changed keys, not entire files
- 📁 **Nested Objects**: Supports complex nested translation structures
- 🚀 **Free Translation**: Uses Google Translate's free API
- 💾 **Hash Tracking**: Prevents unnecessary re-translations using content hashing
- 🔧 **Configurable**: Flexible configuration options
- 📝 **Verbose Logging**: Optional detailed logging for debugging

## 📦 Installation

```bash
npm install translation-sync
```

## 🚀 Quick Start

```javascript
const TranslationSync = require("translation-sync");

const sync = new TranslationSync({
  directory: "./translations",
  sourceLanguage: "en",
  targetLanguages: ["es", "fr", "de", "it"],
  onTranslationComplete: (filename, changes) => {
    console.log(
      `✅ Translated ${Object.keys(changes).length} changes in ${filename}`
    );
  },
});

// Initialize and start watching
async function start() {
  await sync.init();
  await sync.watch();
}

start();
```

## 📋 Configuration Options

| Option                  | Type     | Default            | Description                                    |
| ----------------------- | -------- | ------------------ | ---------------------------------------------- |
| `directory`             | string   | `"./translations"` | Directory containing translation files         |
| `sourceLanguage`        | string   | `"en"`             | Source language code (e.g., "en", "es")        |
| `targetLanguages`       | array    | `[]`               | Array of target language codes                 |
| `onTranslationComplete` | function | `() => {}`         | Callback executed after translation completion |
| `silent`                | boolean  | `false`            | Suppress all console output                    |
| `verbose`               | boolean  | `false`            | Enable detailed translation logging            |

## 📁 File Structure

Your translation files should follow this naming convention:

```
translations/
├── en.json          # Source language
├── es.json          # Spanish translations
├── fr.json          # French translations
├── de.json          # German translations
└── .translation-hashes.json  # Auto-generated hash file
```

### Example Translation File (`en.json`):

```json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete"
    },
    "messages": {
      "success": "Operation completed successfully",
      "error": "An error occurred"
    }
  },
  "navigation": {
    "home": "Home",
    "about": "About Us",
    "contact": "Contact"
  }
}
```

## 🔧 API Reference

### `new TranslationSync(options)`

Creates a new TranslationSync instance with the specified configuration options.

```javascript
const sync = new TranslationSync({
  directory: "./src/i18n",
  sourceLanguage: "en",
  targetLanguages: ["es", "fr", "de"],
  verbose: true,
});
```

### `async init()`

Initializes the translation sync system, creates necessary directories, and loads existing hashes.

```javascript
await sync.init();
```

### `async watch()`

Starts watching the translation directory for file changes. Returns a chokidar watcher instance.

```javascript
const watcher = await sync.watch();

// Stop watching when needed
watcher.close();
```

### `async checkAndTranslate()`

Manually checks all translation files and translates any changes. Useful for one-time synchronization.

```javascript
await sync.checkAndTranslate();
```

## 🛠️ Usage Examples

### One-time Translation Check

```javascript
const TranslationSync = require("translation-sync");

const sync = new TranslationSync({
  directory: "./i18n",
  sourceLanguage: "en",
  targetLanguages: ["es", "fr", "de"],
  verbose: true,
});

async function syncOnce() {
  await sync.init();
  await sync.checkAndTranslate();
  console.log("Translation sync completed!");
}

syncOnce();
```

### File Watching with Custom Callback

```javascript
const TranslationSync = require("translation-sync");

const sync = new TranslationSync({
  directory: "./translations",
  sourceLanguage: "en",
  targetLanguages: ["es", "fr", "de"],
  onTranslationComplete: (filename, changes) => {
    // Custom notification logic
    console.log(
      `🔔 ${filename} updated with ${Object.keys(changes).length} changes`
    );

    // Log specific changes
    Object.entries(changes).forEach(([key, value]) => {
      console.log(`   ${key}: "${value}"`);
    });

    // Could send webhook, update database, etc.
  },
  verbose: true,
});

async function startWatching() {
  await sync.init();
  const watcher = await sync.watch();

  console.log("Translation sync is now watching for changes...");

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nShutting down translation sync...");
    watcher.close();
    process.exit(0);
  });
}

startWatching();
```

### Silent Mode

```javascript
const sync = new TranslationSync({
  directory: "./translations",
  sourceLanguage: "en",
  targetLanguages: ["es", "fr"],
  silent: true, // No console output except errors
});
```

### Integration with Build Scripts

You can create custom scripts that integrate with your build process:

**translate.js**

```javascript
const TranslationSync = require("translation-sync");

const sync = new TranslationSync({
  directory: process.env.TRANSLATIONS_DIR || "./src/translations",
  sourceLanguage: process.env.SOURCE_LANG || "en",
  targetLanguages: (process.env.TARGET_LANGS || "es,fr,de").split(","),
  verbose: process.argv.includes("--verbose"),
});

async function main() {
  await sync.init();

  if (process.argv.includes("--watch")) {
    await sync.watch();
    console.log("Watching for translation changes...");
  } else {
    await sync.checkAndTranslate();
    console.log("Translation check completed.");
  }
}

main().catch(console.error);
```

**package.json**

```json
{
  "scripts": {
    "translate": "node translate.js",
    "translate:watch": "node translate.js --watch",
    "translate:verbose": "node translate.js --verbose",
    "prebuild": "npm run translate"
  }
}
```

## 🌍 Supported Languages

The package supports any language code that Google Translate recognizes. Common language codes include:

- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- `ar` - Arabic

For regional variants, use format like `en-US`, `es-MX`, `zh-CN`, etc.

## 🔍 How It Works

1. **Hash Tracking**: Content hashes are calculated for each translation file to detect changes
2. **Change Detection**: Only modified keys are identified for translation
3. **Smart Translation**: Changed keys are translated to all target languages
4. **File Updates**: Target language files are updated with new translations
5. **Hash Updates**: New hashes are stored to prevent re-translation

## ⚠️ Important Notes

- Only changes in the **source language file** trigger translations
- The package uses Google Translate's unofficial API (free but with rate limits)
- Hash file (`.translation-hashes.json`) should be included in version control
- Nested object structures are fully supported
- Original formatting and key order are preserved
- Translation requests have a 5-second timeout
- The `getOldData()` method is simplified in the current implementation

## 🚨 Limitations

- Uses unofficial Google Translate API which may have rate limits
- No built-in retry mechanism for failed translations
- Simplified old data tracking (may not preserve complete change history)
- No built-in authentication for translation services

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built with [chokidar](https://github.com/paulmillr/chokidar) for file watching
- Uses Google Translate for free translation services

---

**Made with ❤️ for the international development community**
