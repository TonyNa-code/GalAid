# Roadmap

## v0.1.9 Beta Shipped

GalAid is already usable as a static web demo and a Windows desktop beta.

- Static web app with local folder/file diagnosis
- GitHub Pages demo at <https://TonyNa-code.github.io/GalAid/>
- Windows desktop beta with native scanning and one-click launch handoff
- Package and disc-image metadata preflight before extraction or mounting
- Bundled archive extraction handoff with password prompt and automatic rescan
- Disc-image mount/extract handoff with automatic rescan
- Launch candidate scoring for `.exe/.com/.bat/.cmd/.lnk`, installers, and web VN entries
- Commercial/self-developed engine startup-route diagnostics
- Engine fingerprints with evidence and confidence details
- Error recipe matcher for DirectX, DirectPlay, VC++, VB6, .NET, QuickTime/video, RPG Maker RTP, locale, missing files, archive damage, and web VN restrictions
- Screenshot OCR for startup dialogs
- Legacy executable header detection for DOS, Win16, LE/LX, Win32, and Win64 entries
- Old Win32 compatibility guidance for Win95/NT4/Win2000/XP-era entries
- PE import hints for legacy DirectX, VC++, VB6, .NET, QuickTime/video, Flash/ActiveX, and Borland runtime routing
- Local runtime/environment checks
- Launch history, shortcut creation, launch profiles, and launch-failure follow-up
- Support bundles with reports, roadmaps, recipe matches, package previews, privacy summaries, and redacted local paths
- Chinese install/share guide, issue templates, PR template, repository topics, and published Windows release sidecars

## Next Polishing Passes

- Add more metadata-only engine rules for common commercial VN layouts
- Expand startup error recipes from real redacted reports
- Add more archive, split-volume, and disc-image smoke fixtures
- Improve install-media wording for setup-only discs and old installer flows
- Add clearer screenshots or short demo clips for the README and install guide
- Keep release verification, Pages deploys, and repository health checks visible

## 1.0 Hardening

- Signed Windows release builds
- Better Windows runtime prerequisite explanations for non-technical users
- More robust desktop recovery copy when extraction, mounting, OCR, or launch handoff fails
- More contributor-friendly rule examples and fixture templates
- A stable issue-to-rule workflow for community diagnosis reports

## Later Ideas

- Asset explorer for open-format images and audio
- Creator-owned project export reports
- Ren'Py project structure helper
- Optional advanced templates for Wine, Proton, Locale Emulator, and old-runtime handoffs
- A broader generic launch assistant mode outside visual novels
