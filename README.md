# TabsLite Extractor

Extract guitar tabs from a [**TabsLite** Android app](https://github.com/More-Than-Solitaire/Tabs-Lite) backup file using the Ultimate Guitar API.


## Setup

In **Tabs Lite**, go to **Settings** (Guitar in search field) > **Export favorits and playlists**.

This will save **`tabslite_backup.json`** on your phone. Copy this to your computer.

1. Install dependencies:
   ```bash
   npm install
   npm link    # links tabs-lite-extract
   ```

2. Configure the extractor.
   ```bash
   cp config.example.yaml config.yaml
   ```
   Then edit the settings.
   ```yaml
   backup_json: "tabslite_backup.json"      # default: ./tabslite_backup.json
   output_dir: "tabslite-export"            # default: ./tabslite-export
   cache: true                              # default: true
   filename:
     lowercase: true                        # default: false
     replace_spaces_with: "-"               # default: false 
     pattern: "{artist}---{song}-{id}.txt"  # default: {artist} - {song} ({id})
   ```
   This example converts filenames to lowercase, replaces spaces with hyphens, and uses keeps the ID in the filename:   

   It's probably easiest to export to a directory shared with your computer.

## Usage

**Basic extraction**
```bash
tabs-lite-extract
# or
node extract.js
```

**Force re-download** (overwrite files on disk)
```bash
tabs-lite-extract --force
```

**Use custom config**
```bash
tabs-lite-extract --config config.yaml
```

**Filename pattern**

  - Default **`config.example.yaml`**
    ``` 
    'The Weakerthans - Virtute The Cat Explains Her Departure.txt'
    ```
  - With `include_id: true`
    ```
    'The Weakerthans - Virtute The Cat Explains Her Departure (1068619).txt'
    ```
  - **README's `config.yaml`**
    ```
    the-weakerthans---virtute-the-cat-explains-her-departure.txt
    ```

### Ultimate Guitar API

The extractor replicates TabsLite's authentication with Ultimate Guitar's API:
- Generates device ID and API keys
- See [**TabsLite**](https://github.com/More-Than-Solitaire/Tabs-Lite)
