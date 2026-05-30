# Release Draft

## v0.1.9 beta

GalAid v0.1.9 is a launch doctor for visual novel and galgame folders. It helps players answer: "Which file do I run, and why is this game not starting?"

## Highlights

- Static web app that runs locally or on GitHub Pages
- Desktop beta with native folder and file selection
- Desktop one-click launch for scanned compatible Windows `.exe/.com/.bat/.cmd/.lnk` entries
- Launch candidate scoring for `.exe`, `.bat`, `.cmd`, `.lnk`, and `index.html`
- Executable header hints for DOS COM/MZ, Win16 NE, legacy LE/LX, Win32 PE, and Win64 PE entries, with DOS/Win16 routed away from direct launch
- Old Win32 PE subsystem-version hints for Win95/NT4/Win2000/XP compatibility-mode guidance while keeping the entry launchable
- PE import hints for legacy DirectDraw, DirectSound, DirectInput, Direct3D 8/9, WinMM, VC++ runtime DLLs, VB6, .NET, QuickTime, DirectShow/MCI, Flash/ActiveX, and Borland/Delphi dependencies
- Commercial/self-developed engine route based on root executables, same-folder DLLs, resource archives, config files, and working directory
- Evidence explanations, confidence details, and next steps for engine matches
- Optional Locale Emulator, Wine, and Proton launch templates for locale-sensitive profiles
- Manual launch-failure follow-up for no response, crash, mojibake, black screen, and missing DLL/runtime symptoms
- Error screenshot OCR for English, Japanese, and Simplified Chinese dialog text
- Ordered next-step roadmap for beginners
- Runtime and environment checks for locale, paths, DirectX, VC++ runtime, VB6, .NET Framework, QuickTime/video components, RPG Maker RTP, permissions, and web VN local-server needs
- Archive and disc-image guidance for split archives, `.iso`, CUE sheets with referenced `.bin/.img` tracks, `.mds/.mdf`, and similar package stages
- Desktop package preflight for ZIP metadata, bundled/local 7z-compatible RAR/7z/self-extracting EXE listings, CUE track declarations, supported disc-image directory listings, and media/descriptor clues
- Bundled archive extraction handoff: enter a known password if needed, extract locally into a fresh prepared folder, automatically rescan, then launch the top entry from the one-stop flow
- Self-extracting EXE packages are routed to prepare-and-rescan when their internal archive directory can be listed
- Disc-image preparation handoff: mount Windows `.iso` images when available, or best-effort extract supported image files before rescanning
- English default README with Chinese/Japanese translations and Chinese/English/Japanese diagnosis output language
- Chinese quick install and QQ/group-share copy in `docs/INSTALL.zh-CN.md`
- Windows release uploads include generated `.sha256` and `.release.json` sidecars for the portable `.exe`
- Release verifier checks published Windows sidecars and GitHub asset metadata without downloading the large `.exe`
- Community-editable startup error recipes in `data/error-recipes.json`
- Support bundle with reports, launch profiles, launch-failure notes, roadmap, recipe matches, and file manifest
- GitHub issue templates, PR template, CI checks, and GitHub Pages deployment workflow

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

- [x] Replace README demo placeholder with the real GitHub Pages URL.
- [x] Enable GitHub Pages with GitHub Actions as the source.
- [x] Confirm `npm run check` passes locally.
- [x] Confirm `npm run test:smoke` passes locally.
- [x] Confirm `npm run audit:release -- --strict` has no warnings.
- [x] Confirm `npm run verify:release -- v0.1.9-beta` passes against the published Windows beta.
- [x] Add a player-facing Windows install/share guide.
- [ ] Confirm the `Deploy Pages` workflow publishes the static demo.
- [ ] Open the Pages demo and run the built-in game sample.
- [ ] Review `SECURITY.md`, `CODE_OF_CONDUCT.md`, and `docs/CONTRIBUTING.md`.
- [ ] Add repository topics from `docs/REPO_TOPICS.md`.
- [ ] Create a GitHub release using this draft.

## Known Limits

- Web mode does not inspect inside large archives or disc images yet.
- Disc-image extraction depends on what the bundled 7z-compatible helper can read; some older or damaged images may still need manual mounting outside GalAid, though readable `autorun.inf + Start.exe + data1.cab` style layouts are now classified before extraction.
- DOS and Win16 programs are detected and routed, but actually running them still needs a suitable old-runtime environment such as DOSBox or a 32-bit/virtualized Windows setup.
- Old Win32 compatibility hints are metadata-based. They tell the user what to try after a failed launch, but they do not prove the game requires compatibility mode.
- Legacy PE import hints are advisory. They help prioritize old DirectX, runtime, and video compatibility steps, but do not prove the dependency is missing on the user's PC.
- Web OCR may need the browser text-detection API or a Tesseract.js page load.
- Desktop OCR may download language data on first use.
- Launch profiles are hints only; actual desktop launching still requires a user click on a scanned or prepared entry.
- Error recipes are advisory and should be improved through community reports.
