# Good First Issues

Use this list to create beginner-friendly GitHub issues after each release. Keep every issue metadata-only and inside GalAid's safety boundary.

## 1. Add more DirectX error recipe evidence

Labels: `good first issue`, `recipe`

Goal: improve `data/error-recipes.json` so common DirectX 9-era DLL errors are easier to recognize.

Starter clues:

- `d3dx9_*.dll`
- `xinput1_3.dll`
- `dsound.dll`
- `dinput8.dll`

Acceptance checklist:

- Add or refine patterns in `data/error-recipes.json`.
- Keep the action pointed at the official DirectX runtime.
- Run `npm run build:recipes`.
- Run `npm run check`.
- Do not include game files, cracks, serials, or unofficial download links.

## 2. Add more KiriKiri engine fingerprints

Labels: `good first issue`, `engine`

Goal: improve KiriKiri / 吉里吉里 detection beyond the current baseline using filenames and resource archives only.

Useful metadata-only clues:

- `.xp3` archives
- common launcher names
- config or patch filenames

Acceptance checklist:

- Update engine detection without reading file contents.
- Add at least one sample path to the existing built-in sample or a small metadata-only fixture if needed.
- Confirm the roadmap still suggests locale checks for KiriKiri folders.
- Run `npm run check`.

## 3. Add more commercial engine structure examples

Labels: `good first issue`, `engine`

Goal: improve the commercial/self-developed engine route with more metadata-only folder structures.

Useful metadata-only clues:

- root-level `.exe`
- large `.arc`, `.dat`, `.pak`, `.pck`, `.cpk`, `.pac`, or `.vol` archives
- same-folder DLL plugins
- small `.ini` or `.cfg` boot/config files

Acceptance checklist:

- Do not claim a specific private engine name unless there is strong filename evidence.
- Keep the advice focused on startup diagnosis: working directory, complete archives, locale, and runtime checks.
- Add or update a small metadata-only sample if needed.
- Run `npm run check`.

## 4. Polish archive and disc-image copy

Labels: `good first issue`, `documentation`

Goal: keep package-stage guidance clear for beginners who only have `.rar`, `.7z.001`, `.iso`, `.cue/.bin`, or `.mds/.mdf` files.

Acceptance checklist:

- Keep wording beginner-friendly and short.
- Explain safe local next steps: collect all parts, extract from the first part, mount or unpack a disc image.
- Keep ZIP preflight wording clear that it reads directory metadata only and does not extract files.
- Do not mention bypassing disc checks or downloading missing game files.
- Run `npm run check`.

## 5. Extend the browser smoke test

Labels: `good first issue`, `testing`

Goal: add one more assertion to `tests/galaid-smoke.spec.js`.

Good starter assertions:

- the package sample starts with a blocked roadmap step
- the support bundle list contains `file-manifest.json`
- the report tab includes `Next-step roadmap`

Acceptance checklist:

- Keep the smoke test fast and deterministic.
- Do not require real game files.
- Run `npm run test:smoke`.
- Run `npm run check`.

## 6. Add one false-positive report to the recipe guide

Labels: `good first issue`, `docs`

Goal: document what a good redacted false-positive report looks like in `docs/ERROR_RECIPES.md`.

Acceptance checklist:

- Use fake metadata-only paths such as `Game/data.xp3`.
- Show a short redacted error message.
- Remind contributors not to attach logs with private paths.
- Run `npm run check`.
