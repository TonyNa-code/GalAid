# Error Recipe Guide

GalAid keeps common startup-error rules in `data/error-recipes.json`.

`src/error-recipes.js` is generated so the app can still run by opening `index.html` directly. Do not edit the generated file by hand.

Each recipe is advisory. It should help the user understand the likely cause and the next safe local action. It must not include download links to games, cracks, bypass tools, serials, or decryption instructions.

## Recipe Shape

```json
{
  "id": "directx-legacy",
  "title": "DirectX old components",
  "category": "runtime",
  "level": "warning",
  "patterns": ["d3dx\\d+_\\d+\\.dll", "xinput1_3\\.dll"],
  "cause": "Short explanation of why this error happens.",
  "action": "One clear next step.",
  "checklist": ["Step one", "Step two"]
}
```

## Field Notes

- `id`: stable kebab-case key.
- `title`: short user-facing diagnosis label.
- `category`: broad group such as `runtime`, `locale`, `files`, `package`, `web`, `engine`, or `system`.
- `level`: usually `warning`; use `info` only for low-risk observations.
- `patterns`: JavaScript regular-expression strings. They are compiled case-insensitively by default.
- `cause`: what is probably wrong.
- `action`: the safest next step.
- `checklist`: short local steps the user can try.

## False-Positive Example (What Good Evidence Looks Like)

A broad pattern can create an overconfident diagnosis when the pasted text is incomplete.

### Example report (redacted)

- **Pasted error text:** `Failed to initialize renderer: d3d11.dll`
- **Matched recipe:** `directx-legacy`
- **Current diagnosis risk:** could be a false positive because `d3d11.dll` alone does not prove missing legacy DirectX 9 components.

### What evidence would make diagnosis stronger

- A specific missing-file message such as `d3dx9_43.dll was not found`.
- Additional DirectX-related context from the same launch attempt (same timestamp/session).
- Confirmation that the error appears before engine-specific script/loading failures.
- A short list of already-installed runtimes (to avoid repeating irrelevant steps).

When evidence is partial, phrase the diagnosis as a likely cause and suggest one safe verification step first.

## DirectX Legacy Evidence

The `directx-legacy` recipe should stay focused on exact legacy component names. These are good positive examples:

- `d3dx9_43.dll`
- `xinput1_3.dll`
- `xaudio2_7.dll`
- `xapofx1_5.dll`
- `x3daudio1_7.dll`
- `xactengine3_7.dll`
- `d3dcompiler_43.dll`
- `ddraw.dll`
- `d3drm.dll`
- `DirectDraw initialization failed`

Keep broad renderer failures such as `d3d11.dll` as supporting context only. By itself, that text should not trigger the DirectX 9-era runtime route.

## Old Video Component Evidence

The `quicktime-runtime` recipe covers startup failures around old OP/ED playback and movie codec handoffs. Useful exact clues include:

- `qtmlclient.dll`
- `mciqtz32.dll`
- `mciavi32.dll`
- `quartz.dll`
- `ir50_32.dll`
- `iccvid.dll`
- `Video for Windows`
- `Indeo`

## DirectPlay Legacy Evidence

Keep DirectPlay separate from the DirectX 9-era runtime route because the beginner action is different. Good positive examples include:

- `DirectPlay is required`
- `dplayx.dll was not found`
- `dpnet.dll is missing`
- `dpwsockx.dll failed to load`

The recommended action should point to Windows Features: enable `Legacy Components / DirectPlay`, then retry from GalAid's recommended launcher.

## Contribution Checklist

- Keep the rule narrow enough to avoid noisy matches.
- Prefer exact DLL names, engine names, or distinctive phrases.
- Explain prerequisites without pretending GalAid can install them.
- Keep advice local-first and non-destructive.
- Do not add piracy, DRM bypass, cracking, or decryption instructions.
- Run `npm run build:recipes` after editing recipes.
- Run `npm run check` before opening a pull request.
