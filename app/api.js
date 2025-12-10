const https = require('node:https');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

class UGApiClient {
  constructor(deviceIdPath) {
    if (!deviceIdPath) {
      throw new Error('Device ID path is required');
    }
    this.deviceIdPath = deviceIdPath;
    this.deviceId = this.loadDeviceId();
    this.apiKey = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  loadDeviceId() {
    try {
      if (fs.existsSync(this.deviceIdPath)) {
        const storedId = fs.readFileSync(this.deviceIdPath, 'utf8').trim();
        if (this.isValidDeviceId(storedId)) {
          return storedId;
        }
      }
    } catch (error) {
      console.warn(`Warning: Failed to read device ID from ${this.deviceIdPath}: ${error.message}`);
    }
    const newId = this.generateDeviceId();
    this.saveDeviceId(newId);
    return newId;
  }

  saveDeviceId(deviceId) {
    try {
      fs.mkdirSync(path.dirname(this.deviceIdPath), { recursive: true });
      fs.writeFileSync(this.deviceIdPath, deviceId, { encoding: 'utf8' });
    } catch (error) {
      console.warn(`Warning: Failed to persist device ID to ${this.deviceIdPath}: ${error.message}`);
    }
  }

  isValidDeviceId(value) {
    return typeof value === 'string' && /^[0-9a-f]{16}$/.test(value);
  }

  generateDeviceId() {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 16; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  // Get MD5 hash
  getMd5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
  }

  async fetchServerTime() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.ultimate-guitar.com',
        path: '/api/v1/common/hello',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'UGT_ANDROID/5.10.12 (SM-G973F; Android 13)',
          'x-ug-client-id': this.deviceId
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const response = JSON.parse(data);
              if (response.timestamp) {
                const serverTime = new Date(response.timestamp * 1000);
                const year = serverTime.getUTCFullYear();
                const month = String(serverTime.getUTCMonth() + 1).padStart(2, '0');
                const day = String(serverTime.getUTCDate()).padStart(2, '0');
                const hour = serverTime.getUTCHours();
                const timeStr = `${year}-${month}-${day}:${hour}`;
                console.log(`Server time fetched: ${timeStr}`);
                resolve(timeStr);
                return;
              }
            } catch (error) {
              reject(new Error(`Failed to parse server time: ${error.message}`));
              return;
            }
          }
          reject(new Error(`Server time request failed with status ${res.statusCode}`));
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Server time fetch error: ${error.message}`));
      });
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Server time request timed out'));
      });
      req.end();
    });
  }

  // Generate API key
  async updateApiKey() {
    const timeString = await this.fetchServerTime();
    const keyString = `${this.deviceId}${timeString}createLog()`;
    this.apiKey = this.getMd5(keyString);
    console.log(`API Key generated - Device: ${this.deviceId}, Time: ${timeString}, Key: ${this.apiKey}`);
  }

  // Fetch a single tab by ID
  async fetchTab(tabId, retryCount = 0) {
    if (!this.apiKey) {
      await this.updateApiKey();
    }

    return new Promise((resolve, reject) => {
      const url = `/api/v1/tab/info?tab_id=${tabId}&tab_access_type=public`;

      const options = {
        hostname: 'api.ultimate-guitar.com',
        path: url,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Charset': 'utf-8',
          'User-Agent': 'UGT_ANDROID/5.10.12 (SM-G973F; Android 13)',
          'x-ug-client-id': this.deviceId,
          'x-ug-api-key': this.apiKey
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 498) {
            if (retryCount < this.maxRetries) {
              this.updateApiKey().then(() => {
                setTimeout(() => this.fetchTab(tabId, retryCount + 1).then(resolve).catch(reject), 1000);
              }).catch(reject);
              return;
            }
            reject(new Error(`API key expired after ${this.maxRetries} retries for tab ${tabId}`));
            return;
          }

          if (res.statusCode === 451) {
            reject(new Error(`Tab ${tabId} unavailable for legal reasons (451)`));
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for tab ${tabId}: ${data}`));
            return;
          }

          try {
            const tabData = JSON.parse(data);
            resolve(tabData);
          } catch (error) {
            reject(new Error(`Failed to parse JSON for tab ${tabId}: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error(`Request timeout for tab ${tabId}`)));
      req.end();
    });
  }
}

module.exports = UGApiClient;
