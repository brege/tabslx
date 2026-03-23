# tabslx - a Tabs-Lite extractor

Extract guitar tabs from a [**TabsLite** Android app](https://github.com/More-Than-Solitaire/Tabs-Lite) backup file using the Ultimate Guitar API.

> [!IMPORTANT]
> UG's API throttles requests by IP address in a sophisticated release rotation. You get a couple shots a day to perform a full extraction. Sometimes, you may need to just wait awhile (days or a week) before you can sync again.

## Setup

In **Tabs Lite** on your android phone, go to

-  **Settings** (Guitar in search field) > **Export favorites and playlists**.

This will save **`tabslite_backup.json`** on your phone. Copy this to your computer.

1. Install
   ```bash
   npm install -g @brege/tabslx
   ```

2. Configure
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

```
tabslx                          extract tabs using config.yaml
tabslx --force                  re-download and overwrite existing files
tabslx --refresh                regenerate the cached device id
tabslx --config my.yaml         use a specific config file
```

**Filename pattern**

  - With `filename.id: true`
    ``` yaml
    # "{artist} - {song} [{id}].txt"
    'The Weakerthans - Virtute The Cat Explains Her Departure [1068619].txt'
    ```
  - With `filename.id: false`
    ``` yaml
    # "{artist} - {song}.txt"
    'The Weakerthans - Virtute The Cat Explains Her Departure.txt'
    ```
  - Lowercase plus dash spacing:
    ``` yaml
    # "{artist}---{song}-{id}.txt"
    the-weakerthans---virtute-the-cat-explains-her-departure-1068619.txt
    ```

## Acknowledgements

[**TabsLite**](https://github.com/More-Than-Solitaire/Tabs-Lite)

## License

[GPLv3](https://fsf.org/licensing/licenses/gpl-3.0.html)
