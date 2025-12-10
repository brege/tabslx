const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');
const UGApiClient = require('./api');

class TabProcessor {
  constructor(configPath = './config.yaml') {
    this.config = this.loadConfig(configPath);
    this.api = new UGApiClient();
  }

  loadConfig(configPath = './config.yaml') {
    // Always load defaults first
    const defaultConfigPath = path.join(__dirname, 'config.default.yaml');
    let config;

    try {
      const defaultContent = fs.readFileSync(defaultConfigPath, 'utf8');
      config = yaml.load(defaultContent);
    } catch (error) {
      throw new Error(`Failed to load default config: ${error.message}`);
    }

    // Try to load and merge user config if it exists
    if (fs.existsSync(configPath)) {
      try {
        const userContent = fs.readFileSync(configPath, 'utf8');
        const userConfig = yaml.load(userContent);

        // Deep merge user config over defaults
        config = this.mergeConfig(config, userConfig);
      } catch (error) {
        console.warn(`Warning: Failed to load user config ${configPath}, using defaults: ${error.message}`);
      }
    }

    // Expand home directory paths
    config.backup_json = this.expandPath(config.backup_json);
    config.output_dir = this.expandPath(config.output_dir);

    return config;
  }

  mergeConfig(defaults, user) {
    const result = { ...defaults };

    for (const key in user) {
      if (user[key] && typeof user[key] === 'object' && !Array.isArray(user[key])) {
        result[key] = this.mergeConfig(defaults[key] || {}, user[key]);
      } else {
        result[key] = user[key];
      }
    }

    return result;
  }

  expandPath(pathValue) {
    if (pathValue && pathValue.startsWith('~')) {
      return pathValue.replace('~', os.homedir());
    }
    return pathValue;
  }

  sanitizeFilename(text) {
    return text.replace(/[<>:"/\\|?*]/g, '_');
  }

  extractTabIds(backupPath) {
    try {
      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      const tabIds = [];
      const seen = new Set();

      // Extract from playlists in order
      if (backupData.playlists) {
        backupData.playlists.forEach(playlist => {
          if (playlist.entries) {
            playlist.entries.forEach(entry => {
              if (entry.tabId && !seen.has(entry.tabId)) {
                seen.add(entry.tabId);
                tabIds.push(entry.tabId);
              }
            });
          }
        });
      }

      return tabIds;
    } catch (error) {
      throw new Error(`Failed to read backup file: ${error.message}`);
    }
  }

  // Generate filename based on config pattern
  generateFilename(tabData) {
    const { filename } = this.config;

    let artist = tabData.artist_name || 'Unknown Artist';
    let song = tabData.song_name || 'Unknown Song';
    const id = tabData.tab_id || tabData.id || 'unknown';

    if (filename.lowercase) {
      artist = artist.toLowerCase();
      song = song.toLowerCase();
    }

    if (filename.replace_spaces_with) {
      artist = artist.replace(/\s+/g, filename.replace_spaces_with);
      song = song.replace(/\s+/g, filename.replace_spaces_with);
    }

    artist = this.sanitizeFilename(artist);
    song = this.sanitizeFilename(song);

    return filename.pattern
      .replace('{artist}', artist)
      .replace('{song}', song)
      .replace('{id}', id);
  }

  // Format tab content according to config
  formatContent(tabData) {
    const { formatting } = this.config;

    let content = `Title: ${tabData.song_name}
Artist: ${tabData.artist_name}
Album: ${tabData.album_name || 'Unknown'}
Type: ${tabData.type}
Capo: ${tabData.capo}
Tuning: ${tabData.tuning}
Difficulty: ${tabData.difficulty}
Rating: ${tabData.rating} (${tabData.votes} votes)
Tab ID: ${tabData.tab_id || tabData.id || 'unknown'}
URL: ${tabData.url_web || 'N/A'}

${tabData.content}`;

    if (formatting.remove_markup) {
      content = content.replace(/\[(\/?)ch\]/g, '').replace(/\[(\/?)tab\]/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      content = content.replace(/\n{3,}/g, '\n\n');
    }

    return content;
  }

  // Check if file already exists (for caching)
  fileExists(filepath) {
    return fs.existsSync(filepath);
  }

  // Save tab to file
  saveTab(tabData, force = false) {
    const filename = this.generateFilename(tabData);
    const filepath = path.join(this.config.output_dir, filename);

    // Check cache if enabled and not forcing
    if (!force && this.config.cache && this.fileExists(filepath)) {
      return { filepath, cached: true };
    }

    const content = this.formatContent(tabData);

    // Create output directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, content, 'utf8');
    return { filepath, cached: false };
  }

  // Main extraction function
  async extractAllTabs(force = false) {
    console.log('Starting tab extraction...');
    console.log('Config:', {
      backup: this.config.backup_json,
      output: this.config.output_dir,
      cache: this.config.cache
    });

    // Extract tab IDs
    const tabIds = this.extractTabIds(this.config.backup_json);
    console.log(`Found ${tabIds.length} unique tab IDs in backup`);

    // Initialize API
    await this.api.updateApiKey();
    console.log(`Generated API key for device ${this.api.deviceId}`);

    let successful = 0;
    let failed = 0;
    let cached = 0;

    for (let i = 0; i < tabIds.length; i++) {
      const tabId = tabIds[i];
      try {
        console.log(`Processing tab ${i + 1}/${tabIds.length}: ID ${tabId}`);

        const tabData = await this.api.fetchTab(tabId);
        const result = this.saveTab(tabData, force);

        if (result.cached && !force) {
          console.log(`● Cached: ${path.basename(result.filepath)}`);
          cached++;
        } else {
          console.log(`✓ Saved: ${path.basename(result.filepath)}`);
          successful++;
        }

        if (i < tabIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`✗ Failed to fetch tab ${tabId}: ${error.message}`);
        failed++;
      }
    }

    console.log('\\nExtraction complete!');
    console.log(`Successful: ${successful}`);
    console.log(`Cached: ${cached}`);
    console.log(`Failed: ${failed}`);
    console.log(`Output directory: ${path.resolve(this.config.output_dir)}`);
  }
}

module.exports = TabProcessor;
