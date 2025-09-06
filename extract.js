#!/usr/bin/env node
// lint-copy/extract.js

const TabProcessor = require('./processor');

async function main() {
  const args = process.argv.slice(2);
  let configPath = './config.yaml';
  let force = false;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--config' || arg === '-c') {
      configPath = args[i + 1];
      i++;
    } else if (arg === '--force' || arg === '-f') {
      force = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`TabsLite Extractor

Usage: node extract.js [options]

Options:
  -c, --config <path>   Path to config file (default: ./config.yaml)
  -f, --force          Force re-download even if files exist
  -h, --help           Show this help message

Config:
  Defaults loaded from config.default.yaml
  User config.yaml overrides defaults (optional)
  Copy config.default.yaml to config.yaml to customize

Examples:
  node extract.js                    # Use defaults + config.yaml
  node extract.js --force            # Force re-download
  node extract.js --config my.yaml   # Custom config file
`);
      process.exit(0);
    }
  }

  try {
    const processor = new TabProcessor(configPath);
    await processor.extractAllTabs(force);
    console.log('All done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
