<br>

<div align="center">
  <h1>GalAid</h1>
  <p><strong>Drop a VN package. Get a launch route.</strong></p>
  <p><sub>A launch assistant for visual novels, galgame folders, archives, disc images, and stubborn startup errors.</sub></p>

  <p>
    <a href="https://TonyNa-code.github.io/GalAid/"><img alt="Open the live demo" src="https://img.shields.io/badge/Open-Live_Demo-2f855a?style=for-the-badge"></a>
    <a href="https://github.com/TonyNa-code/GalAid/releases/tag/v0.1.8-beta"><img alt="Download Windows beta" src="https://img.shields.io/badge/Download-Windows_Beta-2563eb?style=for-the-badge"></a>
    <a href="docs/CONTRIBUTING.md"><img alt="Contribute" src="https://img.shields.io/badge/Improve-Rules_%26_Recipes-d97706?style=for-the-badge"></a>
  </p>

  <p>
    <img alt="Static web app" src="https://img.shields.io/badge/web-static_app-20252b">
    <img alt="Desktop beta" src="https://img.shields.io/badge/desktop-Windows_beta-407da3">
    <img alt="Screenshot OCR" src="https://img.shields.io/badge/error_screenshot-OCR-7762a6">
    <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-d95a48">
  </p>

  <p>
    <strong>Drag in a folder, archive, or old disc image.</strong><br>
    GalAid prepares the package, finds the likely launcher, starts the desktop route, and turns failures into concrete next steps.
  </p>
</div>

Languages: English / [简体中文](README.zh-CN.md) / [日本語](README.ja.md)

GalAid is a launch doctor for visual novel and galgame folders. It helps players answer the first painful question: "Which file do I run, and why is this game not starting?"

<table>
  <tr>
    <td width="25%" valign="top"><strong>01 Drop</strong><br>Folders, `.zip/.rar/.7z`, split archives, `.iso`, `.cue/.bin`, `.mds/.mdf`, and older VN layouts all enter one flow.</td>
    <td width="25%" valign="top"><strong>02 Prepare</strong><br>GalAid groups packages, asks for a password when needed, extracts or mounts, then rescans the prepared folder.</td>
    <td width="25%" valign="top"><strong>03 Launch</strong><br>The desktop beta ranks launch candidates and can start the selected Windows `.exe/.com` with the right working directory.</td>
    <td width="25%" valign="top"><strong>04 Fix</strong><br>If it fails, paste text or read a screenshot. GalAid turns the error into a DirectX, VC++, locale, RTP, path, or package route.</td>
  </tr>
</table>

<p align="center">
  <img alt="GalAid flow demo" src="docs/assets/galaid-flow-demo.gif">
  <br>
  <sub>One intake flow for packages, disc images, launch candidates, and startup errors.</sub>
</p>

## What It Feels Like

```text
download.zip / game.iso / extracted-folder
        |
        v
   GalAid reads the layout
        |
        +--> prepare package or image
        +--> find the likely launcher
        +--> launch from the right folder
        +--> read screenshots or logs when it fails
        |
        v
  one clear next action instead of guesswork
```

The web app is still useful for quick file-list diagnosis. The desktop beta is the main path for real users because it adds native scanning, package preparation, one-click launch, shortcuts, launch history, and Screenshot OCR.

## Who It Helps

Many visual novel players get stuck before the game even opens:

- archives are not fully extracted
- disc images such as `.iso`, `.cue`, `.bin`, `.mds` are confusing
- Japanese locale, fonts, and path encoding cause mojibake or crashes
- old DirectX / VC++ / RPG Maker RTP dependencies are missing
- folders contain many `.exe` files and it is unclear which one starts the game
- a startup dialog appears, but the user cannot copy the text

GalAid turns that mess into a guided launch route.

## Current Beta

| Surface | Use it for | What you get |
| --- | --- | --- |
| Windows desktop beta | Real player use | Native folder selection, recursive scan, one-stop launch guide, archive/image preparation, one-click launch, shortcuts, launch history, Screenshot OCR. |
| Web demo | Quick preview | File-list diagnosis, engine clues, package stage hints, error recipe matching, report export. |
| Rule data | Community contribution | Engine fingerprints, startup error recipes, package patterns, and smoke-tested examples. |

## Feature Map

<table>
  <tr>
    <td width="33%" valign="top"><strong>Package to folder</strong><br>Split archives, normal archives, disc-image pairs, legacy image formats, and password prompts are folded into one prepare-and-rescan flow.</td>
    <td width="33%" valign="top"><strong>Folder to launcher</strong><br>Launch candidates are ranked against installers, redists, config tools, engine files, working directories, and commercial/self-developed layouts.</td>
    <td width="33%" valign="top"><strong>Error to next step</strong><br>Pasted logs or screenshot OCR feed local recipes for DirectX, VC++, Japanese locale, RPG Maker RTP, missing files, damaged archives, and web VN restrictions.</td>
  </tr>
  <tr>
    <td width="33%" valign="top"><strong>Engine clues</strong><br>Ren'Py, KiriKiri, NScripter, Unity, RPG Maker, Siglus, TyranoScript, and private commercial structures get evidence explanations.</td>
    <td width="33%" valign="top"><strong>Support bundle</strong><br>Reports, roadmaps, profiles, recipe matches, launch-failure notes, environment checks, and file-list summaries are exportable.</td>
    <td width="33%" valign="top"><strong>Contributor loop</strong><br>Most improvements are small JSON rules, reproducible examples, documentation polish, and Playwright smoke tests.</td>
  </tr>
</table>

## Quick Start

| Surface | Start here | Best for |
| --- | --- | --- |
| Live demo | [TonyNa-code.github.io/GalAid](https://TonyNa-code.github.io/GalAid/) | Trying GalAid instantly in a browser. |
| Windows beta | [v0.1.8-beta release](https://github.com/TonyNa-code/GalAid/releases/tag/v0.1.8-beta) | Drag, prepare, rescan, launch, OCR error screenshots, and export support context. |
| Local web app | Open `index.html` or run `python3 -m http.server 4173` | Offline use, development, and quick source inspection. |

## Launch Profiles

The launch button is the user-facing goal. The diagnosis engine is the part that decides which button should exist, what folder it should run from, and what to do when that button does not work.

GalAid can generate a launch profile from the best executable candidate. A profile includes:

- entry file and working directory
- a Windows command hint
- engine and locale notes
- a portable `.galaid-profile.json` file

Profiles do not auto-run games by themselves. In the web app, commands use relative paths. Locale-sensitive profiles can include optional Locale Emulator, Wine, and Proton templates that users can inspect and copy. In the desktop beta, copying a command can use the local path from the folder picker, a deliberate click can launch a scanned Windows `.exe/.com` entry with the correct working directory, and users can create a Windows shortcut for the same entry.

## Next-Step Roadmap

The launch page now starts with a one-stop guide: import, prepare, launch, then collect failure evidence if the game still does not open. The `路线` tab combines the same archive/image state, launch candidates, runtime checks, error recipes, and engine clues into an ordered checklist. It can be copied as Markdown and is also included in support bundles as `roadmap.json` and `roadmap-checklist.md`.

After a launch attempt fails, the `启动` tab can record manual symptoms such as no response, immediate crash, mojibake, black screen, or missing DLL/runtime. GalAid does not monitor the process; those user-entered notes simply feed the roadmap, reports, and support bundle.

## Environment Checks

The environment page turns common "why won't this start?" issues into a checklist before the user starts changing system settings.

It checks whether the folder appears fully extracted, whether a launch entry exists, and whether the metadata or pasted error text points to a commercial/private engine startup chain, Japanese locale, path encoding, old DirectX components, VC++ redistributables, RPG Maker RTP, permissions, or web VN browser restrictions.

For many commercial Japanese VNs, GalAid does not need to name the exact private engine to be useful. A root `.exe` plus large `.arc/.dat/.pak/.pck/.cpk/.pac/.vol` resource archives, nearby DLL plugins, and config files is enough to trigger the commercial/self-developed engine route. That route focuses on preserving the original folder structure, keeping the working directory correct, and checking locale/runtime problems before assuming the game itself is broken.

GalAid explains likely prerequisites; runtime installers, locale changes, and system settings remain user-controlled.

## Screenshot OCR

Startup dialogs are often screenshots, photos, or mojibake windows that cannot be copied. The error panel now accepts an error screenshot and converts recognized text into the same input used by the recipe matcher.

Desktop OCR uses Tesseract.js with English, Japanese, and Simplified Chinese recognition. The first OCR run may download language data into the desktop app cache. The web version uses browser text detection when available and falls back to loading Tesseract.js in the page.

## Error Recipes

Common startup errors live in `data/error-recipes.json` as small data objects. The app can match pasted logs against recipes for DirectX, VC++ redistributables, RPG Maker RTP, locale issues, missing files, archive damage, web VN local-file restrictions, Unity runtime files, mounted-disc checks, and .NET tools.

After editing recipes, run:

```bash
npm run build:recipes
npm run check
```

See [docs/ERROR_RECIPES.md](docs/ERROR_RECIPES.md) for the recipe format and contribution notes.

## Engine Rules

Engine and structure fingerprints live in `data/engine-rules.json`. Contributors can improve KiriKiri, Ren'Py, NScripter, Unity, RPG Maker, Siglus, TyranoScript, and commercial/self-developed route detection with narrow file-structure evidence and regression checks.

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
| Engine evidence | Add a narrow fingerprint with sample filenames and a regression check. |
| Error recipes | Improve a startup-error pattern with clearer evidence and a beginner action. |
| Package guidance | Make archive, split-volume, or disc-image diagnosis less confusing for real users. |
| UX and docs | Make the beginner flow, release notes, screenshots, or issue templates easier to follow. |

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

The `求助` tab also shows exactly what will be included and can copy a short issue-ready summary.

## Diagnosis Output Language

The default repository README stays in English, with Chinese and Japanese translations linked at the top. Inside the app, the assistant output language can be switched between Chinese, English, and Japanese. The setting affects copied reports, downloaded reports, roadmap checklists, support bundle README files, and issue-ready support summaries.

## Large Games

The web app is designed around file-list scanning, so a 10GB extracted game folder is usually fine. Total bytes matter much less than the number of entries the browser needs to index.

The main limit is file count, not total bytes:

- under 20,000 files: normal full metadata scan
- 20,000+ files: large folder mode with compact rendering
- 50,000+ files: large folder mode skips full path sorting to keep the browser responsive

Single large archives or disc images such as `.zip`, `.rar`, `.7z`, `.iso`, `.cue`, `.bin`, `.mds/.mdf`, `.ccd/.img/.sub`, `.nrg`, `.isz`, `.cdi`, BlindWrite images, `.mdx`, `.daa`, `.uif`, and `.pdi` can be identified in the web app. The desktop beta can additionally preflight ZIP central-directory metadata, list RAR/7z metadata through the bundled or local 7z-compatible command, and flag disc-image descriptor/media roles. It can spot likely launchers, installers, split-volume status, old install-media clues, bonus discs, patch-like packages, and engine clues before extraction.

When the user explicitly clicks `Extract and rescan` or `Mount/extract and rescan`, the desktop beta uses a bundled 7z-compatible helper first, then local `7zz` / `7z` / `7za` if needed. It can extract ZIP/RAR/7z packages into a new output folder, ask for a known password when needed, mount Windows `.iso` images through the system mount command, or best-effort extract common disc-image files before automatically rescanning the prepared folder. After preparation, the launch tab highlights the recommended next entry so the user does not have to hunt for it again. If launch still fails, the desktop beta asks the user to mark the visible symptom and folds that into the roadmap.

## Archive and Disc Image Guidance

The web MVP can recognize common package stages and tell the user what to do next:

- split archives: keep every part together and start from `part1.rar`, `.7z.001`, or `.zip.001`
- plain archives: extract fully before running the game
- ISO/NRG/ISZ/CDI images: mount or unpack the image first
- CUE/BIN, MDS/MDF, CCD/IMG/SUB sets: keep paired files together before mounting

The desktop prepare action asks for an output folder when extraction is needed, uses the entered password for that attempt, and returns to scanning after extraction or image preparation finishes.

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

Download the Windows portable beta from [Releases](https://github.com/TonyNa-code/GalAid/releases/tag/v0.1.8-beta), or run the Electron shell locally:

```bash
npm install
npm start
```

The desktop beta uses the same UI and diagnosis engine as the web app, but the folder/file picker is native and can recursively scan local folders without browser directory limitations. It can also launch scanned Windows `.exe/.com` entries after the user clicks `Launch`; GalAid sets the working directory to the entry's folder. The profile tab can create a Windows shortcut for the same entry and shows a recent-launch history.

Windows portable release builds are handled by `.github/workflows/desktop-release.yml` on manual runs or `v*` tags:

```bash
npm run dist:win
```

See [docs/DESKTOP.md](docs/DESKTOP.md) for packaging notes.

## Roadmap

- Better engine fingerprints
- Open-format asset preview
- Community-maintained diagnosis recipes and engine rules

## License

MIT. See `LICENSE`.
