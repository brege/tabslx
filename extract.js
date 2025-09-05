#!/usr/bin/env node

const TabProcessor = require('./processor');
const path = require('path');

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

Config file should contain:
  backup_json: path to TabsLite backup JSON
  output_dir: where to save extracted tabs
  cache: whether to skip existing files
  formatting: content formatting options
  filename: filename formatting options

Examples:
  node extract.js
  node extract.js --config /path/to/config.yaml
  node extract.js --force
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