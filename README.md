# tabslx - a Tabs-Lite extractor

Extract guitar tabs from a [**TabsLite** Android app](https://github.com/More-Than-Solitaire/Tabs-Lite) backup file using the Ultimate Guitar API.

> UG has an IP-hostile API, and throttles requests in a sophisticated pattern with a release rotation. You get a couple shots a day to perform a full extraction. Sometimes, you may need to just wait awhile (a week) before you can sync again.

## Setup

In **Tabs Lite** on your android phone, go to 
  **Settings** (Guitar in search field) > **Export favorits and playlists**. 
This will save **`tabslite_backup.json`** on your phone. Copy this to your computer.

1. Install dependencies
   ```bash
   git clone https://github.com/brege/tabslx
   npm install
   ```

2. Configure the extractor
   ```bash
   cp config.default.yaml config.yaml
   ```
   Then edit `config.yaml`
   ```yaml
   json: "tabslite_backup.json"
   data: "tabslite-export"
   cache: true
   filename:
     lowercase: false
     space: "-"
     id: true
     format: "{artist}---{song}-{id}.txt"
   ```
   - `json` is the exported TabsLite backup.
   - `data` is the output directory (device id cache lives here).
   - `filename.space` replaces whitespace with the given string.
   - `filename.id` toggles whether `{id}` stays in the template.


## Usage

**Basic extraction**
```bash
node cli.js
# or
tabslx
tabslx --help
```

**Force re-download** (overwrite files on disk)
```bash
tabslx --force
```

**Rotate device identity**
```bash
tabslx --refresh
```
Deletes `<data>/.device_id` before starting so a new ID is generated for that output directory.

**Use custom config**
```bash
tabslx --config config.yaml
```
If `config.yaml` doesn't exist in the project root, and without `--config`, then `tabslx --config config.default.yaml` will be used implicitly.

**Filename pattern**

  - With `filename.id: true`
    ```
    # "{artist} - {song} [{id}].txt"
    'The Weakerthans - Virtute The Cat Explains Her Departure [1068619].txt'
    ```
  - With `filename.id: false`
    ```
    # "{artist} - {song}.txt"
    'The Weakerthans - Virtute The Cat Explains Her Departure.txt'
    ```
  - Lowercase plus dash spacing:
    ```
    # "{artist}---{song}-{id}.txt"
    the-weakerthans---virtute-the-cat-explains-her-departure-1068619.txt
    ```

## Acknowledgements

[**TabsLite**](https://github.com/More-Than-Solitaire/Tabs-Lite).

## License

[GPLv3](https://fsf.org/licensing/licenses/gpl-3.0.html)
