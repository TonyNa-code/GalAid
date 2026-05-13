# GalAid

GalAid is a local-first launch doctor for visual novel and galgame folders.

It helps players and archivists answer the first painful question: "Which file do I run, and why is this game not starting?"

The first version is a static web app. Open `index.html`, drop in a folder or select files, and GalAid analyzes only file names, paths, sizes, and extensions in your browser. A desktop shell is also available for native folder selection and full local path scanning.

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
- Generate safe launch profiles with command hints and portable JSON config
- Flag installer/support tools that should not be used as the main launcher
- Identify archives, split archives, and disc images such as `.part1.rar`, `.7z.001`, `.iso`, `.cue/.bin`, `.mds/.mdf`
- Detect engine clues for Ren'Py, KiriKiri, NScripter, Unity, RPG Maker, Siglus, and TyranoScript
- Warn about archive-only imports, disc images, non-English paths, long paths, and locale-sensitive engines
- Run a runtime/environment checklist for extraction state, launch entry, locale, paths, DirectX, VC++ runtime, RPG Maker RTP, permissions, and web VN local-server needs
- Match pasted error text against a data-driven recipe library for common VN startup failures
- Map common asset categories: images, audio, video, scripts, resource archives, launchers
- Analyze pasted error text for DirectX, VC++ runtime, RPG Maker RTP, locale, missing-file, and permission clues
- Large folder mode for 20,000+ file folders, with capped UI samples and full metadata-based reporting
- Desktop beta with native folder/file picker and recursive local scanning
- Copy or download a Markdown diagnosis report
- Preview and download a local support ZIP with report, safe launch profiles, matched error recipes, environment checks, and sanitized file metadata
- Copy an issue-ready support summary without exposing game files
- Runs fully in the browser with no upload

## Launch Profiles

GalAid can generate a launch profile from the best executable candidate. A profile includes:

- entry file and working directory
- a Windows command hint
- engine and locale notes
- a portable `.galaid-profile.json` file

Profiles do not auto-run games. In the web app, commands use relative paths. In the desktop beta, copying a command can use the local path from the folder picker.

## Environment Checks

The environment page turns common "why won't this start?" issues into a checklist before the user starts changing system settings.

It checks whether the folder appears fully extracted, whether a launch entry exists, and whether the metadata or pasted error text points to Japanese locale, path encoding, old DirectX components, VC++ redistributables, RPG Maker RTP, permissions, or web VN browser restrictions.

GalAid only explains likely prerequisites. It does not install runtimes, change system locale, mount images, or execute games automatically.

## Error Recipes

Common startup errors live in `src/error-recipes.js` as small data objects. The app can match pasted logs against recipes for DirectX, VC++ redistributables, RPG Maker RTP, locale issues, missing files, archive damage, web VN local-file restrictions, Unity runtime files, mounted-disc checks, and .NET tools.

See `docs/ERROR_RECIPES.md` for the recipe format and contribution notes.

## Support Bundle

The support bundle is a local `.zip` for asking for help in an issue, forum, or chat. It includes:

- `galaid-report.md`
- `manifest.json`
- `file-manifest.json`
- `environment-checks.json`
- `error-recipes.json`
- `launch-profiles.json`
- individual `profiles/*.galaid-profile.json` files

It does not include game files or file contents. File paths are relative, and desktop absolute paths are omitted. Very large folders are capped in `file-manifest.json` to keep the bundle small.

The `求助` tab also shows exactly what will be included and can copy a short issue-ready summary.

## Large Games

The web app is designed around metadata scanning, so a 10GB extracted game folder is usually fine. GalAid reads file names, relative paths, extensions, and sizes; it does not read the file contents.

The main limit is file count, not total bytes:

- under 20,000 files: normal full metadata scan
- 20,000+ files: large folder mode with compact rendering
- 50,000+ files: large folder mode skips full path sorting to keep the browser responsive

Single large archives or disc images such as `.zip`, `.rar`, `.7z`, `.iso`, `.cue`, and `.bin` can be identified in the web app, but their internal file trees are not scanned yet. Deep archive and image inspection belongs in the future desktop app.

## Archive and Disc Image Guidance

The web MVP can recognize common package stages and tell the user what to do next:

- split archives: keep every part together and start from `part1.rar`, `.7z.001`, or `.zip.001`
- plain archives: extract fully before running the game
- ISO/NRG/ISZ/CDI images: mount or unpack the image first
- CUE/BIN, MDS/MDF, CCD/IMG/SUB sets: keep paired files together before mounting

The web app still does not inspect the contents of these files. It only checks metadata and naming patterns.

## Run

### Web App

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

### Desktop Beta

Install dependencies and start the Electron shell:

```bash
npm install
npm start
```

The desktop beta uses the same UI and diagnosis engine as the web app, but the folder/file picker is native and can recursively scan local folders without browser directory limitations.

## Safety Boundary

GalAid does not provide games, cracks, DRM bypasses, or decryption keys.

The app is intended for:

- diagnosing legally obtained local copies
- helping users understand launch/runtime problems
- organizing personal archives
- assisting creators and translators with their own project folders

The static web MVP only reads browser-exposed file metadata. The desktop beta can see absolute paths while scanning, but reports and UI use relative paths by default. GalAid does not upload, execute, modify, decrypt, or extract game files.

## Roadmap

- Desktop version for Windows with real shortcut creation and optional launch profiles
- Locale Emulator / Wine / Proton hint integration
- Screenshot OCR for error dialogs
- Better engine fingerprints
- Safe open-format asset preview
- Community-maintained diagnosis recipes

## License

MIT. See `LICENSE`.
