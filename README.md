# TabsLite Extractor

Extract guitar tabs from a [**TabsLite** Android app](https://github.com/More-Than-Solitaire/Tabs-Lite) backup file using the Ultimate Guitar API.

## Setup

In **Tabs Lite**, go to **Settings** (Guitar in search field) > **Export favorits and playlists**.
Then transfer the backup file to your computer.

This will save **`tabslite_backup.json`** on your phone. Copy this to your computer.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the extractor.
   ```bash
   cp config.default.yaml config.yaml
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


## Usage

**Basic extraction**
```bash
node extract.js  # [ --help ]
# or
npm link
tabs-lite-extract  # [ --help ]
```

**Force re-download** (overwrite files on disk)
```bash
tabs-lite-extract --force
```

**Use custom config**
```bash
tabs-lite-extract --config config.yaml
```
If `config.yaml` doesn't exist in the project root, and without `--config`, then `tabs-lite-extract --config config.default.yaml` will be used implicitly.

**Filename pattern**

  - Default **`config.default.yaml`**
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

[**TabsLite**](https://github.com/More-Than-Solitaire/Tabs-Lite).
