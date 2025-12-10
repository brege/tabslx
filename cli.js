#!/usr/bin/env node

const TabProcessor = require('./app/processor');

async function main() {
  const args = process.argv.slice(2);
  let configPath = './config.yaml';
  let force = false;
  let refreshDeviceId = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--config' || arg === '-c') {
      if (!args[i + 1]) {
        console.error('Error: --config requires a path argument');
        process.exit(1);
      }
      configPath = args[i + 1];
      i++;
    } else if (arg === '--force' || arg === '-f') {
      force = true;
    } else if (arg === '--refresh' || arg === '-r') {
      refreshDeviceId = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`TabsLite Extractor

Usage: node cli.js [options]

Options:
  -c, --config <path>   path to config file (default: ./config.yaml)
  -f, --force           force re-download even if files exist
  -h, --help            show this help message
  -r, --refresh         delete cached device id for output directory

Config:
 - defaults loaded from config.default.yaml
 - user config.yaml overrides defaults (optional)
 - copy config.default.yaml to config.yaml to customize

Examples:
  node cli.js                    # use defaults + config.yaml
  node cli.js --force            # force re-download
  node cli.js --config my.yaml   # custom config file
`);
      process.exit(0);
    }
  }

  try {
    const processor = new TabProcessor(configPath, { refreshDeviceId });
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
