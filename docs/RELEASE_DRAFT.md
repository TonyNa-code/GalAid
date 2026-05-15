# Release Draft

## v0.1.0 beta

GalAid v0.1.0 is a local-first launch doctor for visual novel and galgame folders. It helps players answer: "Which file do I run, and why is this game not starting?"

## Highlights

- Static web app that runs locally or on GitHub Pages
- Desktop beta with native folder and file selection
- Launch candidate scoring for `.exe`, `.bat`, `.cmd`, `.lnk`, and `index.html`
- Ordered next-step roadmap for beginners
- Runtime and environment checks for locale, paths, DirectX, VC++ runtime, RPG Maker RTP, permissions, and web VN local-server needs
- Archive and disc-image guidance for split archives, `.iso`, `.cue/.bin`, `.mds/.mdf`, and similar package stages
- Desktop ZIP directory preflight that spots internal launch and engine clues without extracting files
- Community-editable startup error recipes in `data/error-recipes.json`
- Metadata-only support bundle with reports, launch profiles, roadmap, recipe matches, and sanitized file manifest
- GitHub issue templates, PR template, CI checks, and GitHub Pages deployment workflow

## Safety Boundary

GalAid does not provide games, cracks, DRM bypasses, serials, decryption keys, or unauthorized asset extraction.

The app reads metadata such as filenames, relative paths, sizes, extensions, and ZIP directory entries. It does not upload game files or file contents.

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
- Desktop ZIP preflight reads directory metadata only; RAR/7z and disc-image internals are not inspected yet.
- Desktop beta is for local recursive scanning, not automatic launching.
- Launch profiles are hints only; GalAid does not run games automatically.
- Error recipes are advisory and should be improved through safe community reports.
