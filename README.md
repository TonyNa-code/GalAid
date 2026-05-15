<br>

<div align="center">
  <h1>GalAid</h1>
  <p><strong>A local-first launch doctor for visual novel and galgame folders.</strong></p>
  <p><sub>Archive chaos in. Launch-ready evidence out. No game files uploaded.</sub></p>

  <p>
    <a href="https://TonyNa-code.github.io/GalAid/"><img alt="Open the live demo" src="https://img.shields.io/badge/Open-Live_Demo-2f855a?style=for-the-badge"></a>
    <a href="https://github.com/TonyNa-code/GalAid/releases/tag/v0.1.6-beta"><img alt="Download Windows beta" src="https://img.shields.io/badge/Download-Windows_Beta-2563eb?style=for-the-badge"></a>
    <a href="docs/CONTRIBUTING.md"><img alt="Contribute" src="https://img.shields.io/badge/Improve-Rules_%26_Recipes-d97706?style=for-the-badge"></a>
  </p>

  <p>
    <img alt="Local-first" src="https://img.shields.io/badge/local--first-no_upload-36a779">
    <img alt="Metadata only" src="https://img.shields.io/badge/metadata-only-5b5f97">
    <img alt="Static web app" src="https://img.shields.io/badge/web-static_app-20252b">
    <img alt="Desktop beta" src="https://img.shields.io/badge/desktop-Windows_beta-407da3">
    <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-d95a48">
  </p>
</div>

Languages: English / [简体中文](README.zh-CN.md) / [日本語](README.ja.md)

GalAid is a local-first launch doctor for visual novel and galgame folders. It helps players answer the first painful question: "Which file do I run, and why is this game not starting?"

<table>
  <tr>
    <td width="33%" valign="top"><strong>1. Read the package</strong><br>Drop a folder, archive, or disc-image file list. GalAid looks at names, paths, sizes, and extensions only.</td>
    <td width="33%" valign="top"><strong>2. Find the route</strong><br>Get launch candidates, engine clues, runtime checks, archive guidance, and an ordered next-step roadmap.</td>
    <td width="33%" valign="top"><strong>3. Launch or ask</strong><br>Use the desktop beta to launch trusted entries, or export a metadata-only support bundle for help.</td>
  </tr>
</table>

<p align="center">
  <img alt="GalAid roadmap demo" src="docs/assets/galaid-roadmap-demo.png">
</p>

The first version is a static web app. Open `index.html`, drop in a folder or select files, and GalAid analyzes only file names, paths, sizes, and extensions in your browser. A desktop shell is also available for native folder selection and full local path scanning.

## Why It Exists

Many visual novel players get stuck before the game even opens:

- archives are not fully extracted
- disc images such as `.iso`, `.cue`, `.bin`, `.mds` are confusing
- Japanese locale, fonts, and path encoding cause mojibake or crashes
- old DirectX / VC++ / RPG Maker RTP dependencies are missing
- folders contain many `.exe` files and it is unclear which one starts the game

GalAid turns that mess into a small diagnosis report.

## Feature Map

| Area | What GalAid does | Useful when |
| --- | --- | --- |
| Launch route | Ranks `.exe`, `.bat`, `.cmd`, `.lnk`, and `index.html` candidates, while flagging installers and support tools. | A folder has many executables and no obvious start button. |
| Package diagnosis | Identifies archives, split archives, and disc images such as `.part1.rar`, `.7z.001`, `.iso`, `.cue/.bin`, and `.mds/.mdf`. | The download still looks like a pile of compressed parts or old disc files. |
| Engine clues | Detects Ren'Py, KiriKiri, NScripter, Unity, RPG Maker, Siglus, TyranoScript, and commercial/self-developed VN layouts with evidence explanations and next steps. | The game uses a private or company-specific structure instead of a famous public engine. |
| Runtime checks | Checks extraction state, locale, paths, DirectX, VC++ runtime, RPG Maker RTP, permissions, web VN local-server needs, and manual launch-failure follow-up evidence. | The right launcher exists, but the game crashes, shows mojibake, or complains about missing DLLs. |
| Support bundle | Exports reports, roadmaps, launch profiles, matched recipes, launch-failure notes, environment checks, and sanitized file metadata. | A player needs to ask for help without uploading game files or private paths. |
| Desktop beta | Adds native folder selection, recursive local scanning, ZIP/RAR/7z package preflight, local archive extraction handoff, disc-image metadata preflight, trusted Windows `.exe/.com` launching, shortcut creation, and launch history. | Browser directory picking is not enough, or the user wants a more guided local workflow. |

## Product Shape

<table>
  <tr>
    <td width="25%" valign="top"><strong>Local-first</strong><br>No server is required for diagnosis. The web app runs as static files, and the desktop beta keeps scanning local.</td>
    <td width="25%" valign="top"><strong>Metadata-only</strong><br>GalAid reads filenames, relative paths, extensions, and sizes. It does not upload or include game contents.</td>
    <td width="25%" valign="top"><strong>Beginner-readable</strong><br>The output is an ordered route: extract this, mount that, try this launcher, check this runtime.</td>
    <td width="25%" valign="top"><strong>Contributor-friendly</strong><br>Most improvements are small data rules, redacted evidence, docs, or focused tests around real user flows.</td>
  </tr>
</table>

## Quick Start

| Surface | Start here | Best for |
| --- | --- | --- |
| Live demo | [TonyNa-code.github.io/GalAid](https://TonyNa-code.github.io/GalAid/) | Trying GalAid instantly in a browser. |
| Windows beta | [v0.1.6-beta release](https://github.com/TonyNa-code/GalAid/releases/tag/v0.1.6-beta) | Native folder picking, recursive scans, package/image preflight, archive extraction handoff, trusted one-click launch, shortcuts, launch history, locale launch templates, and launch-failure follow-up. |
| Local web app | Open `index.html` or run `python3 -m http.server 4173` | Offline use, development, and quick source inspection. |

## Launch Profiles

GalAid can generate a launch profile from the best executable candidate. A profile includes:

- entry file and working directory
- a Windows command hint
- engine and locale notes
- a portable `.galaid-profile.json` file

Profiles do not auto-run games by themselves. In the web app, commands use relative paths. Locale-sensitive profiles can include optional Locale Emulator, Wine, and Proton templates that users can inspect and copy. In the desktop beta, copying a command can use the local path from the folder picker, a deliberate click can launch a trusted scanned Windows `.exe/.com` entry with the correct working directory, and users can create a Windows shortcut for the same allowlisted entry.

## Next-Step Roadmap

The `路线` tab combines archive/image state, launch candidates, runtime checks, error recipes, and engine clues into an ordered checklist. It can be copied as Markdown and is also included in support bundles as `roadmap.json` and `roadmap-checklist.md`.

After a launch attempt fails, the `启动` tab can record manual symptoms such as no response, immediate crash, mojibake, black screen, or missing DLL/runtime. GalAid does not monitor the process; those user-entered notes simply feed the roadmap, reports, and support bundle.

## Environment Checks

The environment page turns common "why won't this start?" issues into a checklist before the user starts changing system settings.

It checks whether the folder appears fully extracted, whether a launch entry exists, and whether the metadata or pasted error text points to a commercial/private engine startup chain, Japanese locale, path encoding, old DirectX components, VC++ redistributables, RPG Maker RTP, permissions, or web VN browser restrictions.

For many commercial Japanese VNs, GalAid does not need to name the exact private engine to be useful. A root `.exe` plus large `.arc/.dat/.pak/.pck/.cpk/.pac/.vol` resource archives, nearby DLL plugins, and config files is enough to trigger the commercial/self-developed engine route. That route focuses on preserving the original folder structure, keeping the working directory correct, and checking locale/runtime problems before assuming the game itself is broken.

GalAid only explains likely prerequisites. It does not install runtimes, change system locale, mount images, or execute games automatically.

## Error Recipes

Common startup errors live in `data/error-recipes.json` as small data objects. The app can match pasted logs against recipes for DirectX, VC++ redistributables, RPG Maker RTP, locale issues, missing files, archive damage, web VN local-file restrictions, Unity runtime files, mounted-disc checks, and .NET tools.

After editing recipes, run:

```bash
npm run build:recipes
npm run check
```

See [docs/ERROR_RECIPES.md](docs/ERROR_RECIPES.md) for the recipe format and contribution notes.

## Engine Rules

Engine and structure fingerprints live in `data/engine-rules.json`. The rules use only metadata such as filenames, extensions, and relative paths, so contributors can improve KiriKiri, Ren'Py, NScripter, Unity, RPG Maker, Siglus, TyranoScript, and commercial/self-developed route detection without touching game contents.

The engine panel explains why each route matched, shows the confidence score, lists the metadata evidence, and gives a concrete next step. This keeps commercial/self-developed detection useful without pretending to know a private engine name.

After editing engine rules, run:

```bash
npm run build:engines
npm run check
```

See [docs/ENGINE_RULES.md](docs/ENGINE_RULES.md) for the rule format and contribution notes.

CI runs the same check on pull requests and pushes to `main`.

Browser smoke tests run in GitHub Actions after installing Chromium. Run them locally with:

```bash
npm run test:smoke
```

## Contributing

Recipe improvements, engine fingerprints, docs, and redacted false-positive reports are welcome. Start with [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

High-signal pull requests usually land in one of these lanes:

| Lane | Good contribution |
| --- | --- |
| Engine evidence | Add a narrow, metadata-only fingerprint with sample filenames and a regression check. |
| Error recipes | Improve a startup-error pattern with safer wording, clearer evidence, and a beginner action. |
| Package guidance | Make archive, split-volume, or disc-image diagnosis less confusing for real users. |
| Safety and docs | Clarify what GalAid does locally, what it never uploads, and how users should ask for help. |

For new startup-error rules, open a "New error recipe" issue or edit `data/error-recipes.json` directly in a pull request.

For engine and commercial/self-developed structure clues, edit `data/engine-rules.json`.

Starter tasks live in [docs/GOOD_FIRST_ISSUES.md](docs/GOOD_FIRST_ISSUES.md).

Please also read [SECURITY.md](SECURITY.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Release notes and repository topic suggestions live in [docs/RELEASE_DRAFT.md](docs/RELEASE_DRAFT.md) and [docs/REPO_TOPICS.md](docs/REPO_TOPICS.md).

## Support Bundle

The support bundle is a local `.zip` for asking for help in an issue, forum, or chat. It includes:

- `galaid-report.md`
- `manifest.json`
- `file-manifest.json`
- `environment-checks.json`
- `roadmap.json`
- `roadmap-checklist.md`
- `error-recipes.json`
- `launch-failure.json` when manual follow-up evidence exists
- `launch-profiles.json`
- individual `profiles/*.galaid-profile.json` files

It does not include game files or file contents. File paths are relative, and desktop absolute paths are omitted. Very large folders are capped in `file-manifest.json` to keep the bundle small.

The `求助` tab also shows exactly what will be included and can copy a short issue-ready summary.

## Diagnosis Output Language

The default repository README stays in English, with Chinese and Japanese translations linked at the top. Inside the app, the assistant output language can be switched between Chinese, English, and Japanese. The setting affects copied reports, downloaded reports, roadmap checklists, support bundle README files, and issue-ready support summaries.

## Large Games

The web app is designed around metadata scanning, so a 10GB extracted game folder is usually fine. GalAid reads file names, relative paths, extensions, and sizes; it does not read the file contents.

The main limit is file count, not total bytes:

- under 20,000 files: normal full metadata scan
- 20,000+ files: large folder mode with compact rendering
- 50,000+ files: large folder mode skips full path sorting to keep the browser responsive

Single large archives or disc images such as `.zip`, `.rar`, `.7z`, `.iso`, `.cue`, and `.bin` can be identified in the web app. The desktop beta can additionally preflight ZIP central-directory metadata, list RAR/7z metadata through a local 7z-compatible command when available, and flag disc-image descriptor/media roles. It can spot likely launchers, installers, split-volume status, and engine clues without extracting, mounting, uploading, or reading game file contents.

When the user explicitly clicks `Extract and rescan`, the desktop beta can use a local `7zz` / `7z` / `7za` command to extract ZIP/RAR/7z packages into a newly created output folder, ask for a known password when needed, then automatically rescan the extracted folder so the launch page can recommend the next executable.

## Archive and Disc Image Guidance

The web MVP can recognize common package stages and tell the user what to do next:

- split archives: keep every part together and start from `part1.rar`, `.7z.001`, or `.zip.001`
- plain archives: extract fully before running the game
- ISO/NRG/ISZ/CDI images: mount or unpack the image first
- CUE/BIN, MDS/MDF, CCD/IMG/SUB sets: keep paired files together before mounting

The web app still does not inspect the contents of these files. It only checks metadata and naming patterns.

The desktop package preflight stays metadata-only until the user clicks the extraction action. That action still stays local: it asks the user for an output folder, uses the password only for that extraction attempt, does not store it, and returns to scanning after extraction finishes.

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

### GitHub Pages Demo

For a public repository, enable GitHub Pages with GitHub Actions as the source. The `Deploy Pages` workflow builds the static demo from `index.html`, `src/`, `data/error-recipes.json`, `data/engine-rules.json`, and `LICENSE`, then publishes the `dist/` artifact. The demo URL is usually `https://TonyNa-code.github.io/GalAid/`.

Build the same artifact locally:

```bash
npm run build:pages
```

### Desktop Beta

Download the Windows portable beta from [Releases](https://github.com/TonyNa-code/GalAid/releases/tag/v0.1.6-beta), or run the Electron shell locally:

```bash
npm install
npm start
```

The desktop beta uses the same UI and diagnosis engine as the web app, but the folder/file picker is native and can recursively scan local folders without browser directory limitations. It can also launch trusted scanned Windows `.exe/.com` entries after the user clicks `Launch`; GalAid sets the working directory to the entry's folder and does not add hidden arguments. The profile tab can create a Windows shortcut for an allowlisted entry and shows a recent-launch history using relative path metadata.

Windows portable release builds are handled by `.github/workflows/desktop-release.yml` on manual runs or `v*` tags:

```bash
npm run dist:win
```

See [docs/DESKTOP.md](docs/DESKTOP.md) for packaging notes.

## Safety Boundary

GalAid does not provide games, cracks, DRM bypasses, or decryption keys.

The app is intended for:

- diagnosing legally obtained local copies
- helping users understand launch/runtime problems
- organizing personal archives
- assisting creators and translators with their own project folders

The static web MVP only reads browser-exposed file metadata. The desktop beta can see absolute paths while scanning, but reports and UI use relative paths by default. Package preflight reads local directory or media metadata only. Archive extraction only happens after an explicit desktop action and a user-chosen output folder. GalAid does not upload, silently execute, modify original packages, decrypt unknown passwords, or mount game files.

## Roadmap

- Screenshot OCR for error dialogs
- Better engine fingerprints
- Safe open-format asset preview
- Community-maintained diagnosis recipes and engine rules

## License

MIT. See `LICENSE`.
