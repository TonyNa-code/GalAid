# Release Draft

## v0.1.7 beta

GalAid v0.1.7 is a local-first launch doctor for visual novel and galgame folders. It helps players answer: "Which file do I run, and why is this game not starting?"

## Highlights

- Static web app that runs locally or on GitHub Pages
- Desktop beta with native folder and file selection
- Desktop one-click launch for trusted scanned Windows `.exe/.com` entries
- Launch candidate scoring for `.exe`, `.bat`, `.cmd`, `.lnk`, and `index.html`
- Commercial/self-developed engine route based on root executables, same-folder DLLs, resource archives, config files, and working directory
- Evidence explanations, confidence details, and next steps for engine matches
- Optional Locale Emulator, Wine, and Proton launch templates for locale-sensitive profiles
- Manual launch-failure follow-up for no response, crash, mojibake, black screen, and missing DLL/runtime symptoms
- Ordered next-step roadmap for beginners
- Runtime and environment checks for locale, paths, DirectX, VC++ runtime, RPG Maker RTP, permissions, and web VN local-server needs
- Archive and disc-image guidance for split archives, `.iso`, `.cue/.bin`, `.mds/.mdf`, and similar package stages
- Desktop package preflight for ZIP metadata, bundled/local 7z-compatible RAR/7z listings, and disc-image media/descriptor clues
- Bundled archive extraction handoff: choose an output folder, enter a known password if needed, extract locally, then automatically rescan the prepared folder
- Disc-image preparation handoff: mount Windows `.iso` images when available, or best-effort extract supported image files before rescanning
- English default README with Chinese/Japanese translations and Chinese/English/Japanese diagnosis output language
- Community-editable startup error recipes in `data/error-recipes.json`
- Metadata-only support bundle with reports, launch profiles, launch-failure notes, roadmap, recipe matches, and sanitized file manifest
- GitHub issue templates, PR template, CI checks, and GitHub Pages deployment workflow

## Safety Boundary

GalAid does not provide games, cracks, DRM bypasses, serials, decryption keys, or unauthorized asset extraction.

The app reads metadata such as filenames, relative paths, sizes, extensions, ZIP directory entries, safe bundled/local 7z-compatible archive listings, and disc-image media/descriptor roles. It does not upload game files or file contents. Archive extraction, image extraction, and ISO mounting only happen after an explicit desktop action.

## Try It

After publishing the repository and enabling GitHub Pages with GitHub Actions as the source:

```text
https://TonyNa-code.github.io/GalAid/
```

Local web app:

```bash
python3 -m http.server 4173
```

Desktop beta:

```bash
npm install
npm start
```

## Pre-Release Checklist

- [ ] Replace README demo placeholder with the real GitHub Pages URL.
- [ ] Enable GitHub Pages with GitHub Actions as the source.
- [ ] Confirm `npm run check` passes locally.
- [ ] Confirm `npm run test:smoke` passes locally.
- [ ] Confirm `npm run audit:release -- --strict` has no warnings.
- [ ] Confirm the `Deploy Pages` workflow publishes the static demo.
- [ ] Open the Pages demo and run the built-in game sample.
- [ ] Review `SECURITY.md`, `CODE_OF_CONDUCT.md`, and `docs/CONTRIBUTING.md`.
- [ ] Add repository topics from `docs/REPO_TOPICS.md`.
- [ ] Create a GitHub release using this draft.

## Known Limits

- Web mode does not inspect inside large archives or disc images yet.
- Desktop package preflight stays metadata-only until the user clicks the prepare action.
- Disc-image extraction depends on what the bundled 7z-compatible helper can read; some older or damaged images may still need manual mounting outside GalAid.
- Desktop beta only launches trusted scanned `.exe/.com` entries after an explicit user click.
- Desktop one-click launch only starts trusted scanned `.exe/.com` entries after the user clicks.
- Launch profiles are hints only; GalAid does not run games automatically.
- Error recipes are advisory and should be improved through safe community reports.
