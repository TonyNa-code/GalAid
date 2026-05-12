# GalAid

GalAid is a local-first launch doctor for visual novel and galgame folders.

It helps players and archivists answer the first painful question: "Which file do I run, and why is this game not starting?"

The first version is a static web app. Open `index.html`, drop in a folder or select files, and GalAid analyzes only file names, paths, sizes, and extensions in your browser.

## Why

Many visual novel players get stuck before the game even opens:

- archives are not fully extracted
- disc images such as `.iso`, `.cue`, `.bin`, `.mds` are confusing
- Japanese locale, fonts, and path encoding cause mojibake or crashes
- old DirectX / VC++ / RPG Maker RTP dependencies are missing
- folders contain many `.exe` files and it is unclear which one starts the game

GalAid turns that mess into a small diagnosis report.

## Current Features

- Detect likely launch entries: `.exe`, `.bat`, `.cmd`, `.lnk`, `index.html`
- Flag installer/support tools that should not be used as the main launcher
- Detect engine clues for Ren'Py, KiriKiri, NScripter, Unity, RPG Maker, Siglus, and TyranoScript
- Warn about archive-only imports, disc images, non-English paths, long paths, and locale-sensitive engines
- Map common asset categories: images, audio, video, scripts, resource archives, launchers
- Analyze pasted error text for DirectX, VC++ runtime, RPG Maker RTP, locale, missing-file, and permission clues
- Copy or download a Markdown diagnosis report
- Runs fully in the browser with no upload

## Run

Open this file directly:

```text
index.html
```

Or serve it locally:

```bash
cd GalAid
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## Safety Boundary

GalAid does not provide games, cracks, DRM bypasses, or decryption keys.

The app is intended for:

- diagnosing legally obtained local copies
- helping users understand launch/runtime problems
- organizing personal archives
- assisting creators and translators with their own project folders

The static web MVP only reads browser-exposed file metadata. It does not upload, execute, modify, decrypt, or extract game files.

## Roadmap

- Desktop version for Windows with real shortcut creation and optional launch profiles
- Locale Emulator / Wine / Proton hint integration
- Screenshot OCR for error dialogs
- Better engine fingerprints
- Safe open-format asset preview
- Community-maintained diagnosis recipes

## License

MIT. See `LICENSE`.
