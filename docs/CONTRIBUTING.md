# Contributing to GalAid

Thanks for helping make visual novel launch issues less painful.

GalAid is local-first and safety-focused. Contributions should help users diagnose legally obtained local folders without uploading, executing, modifying, decrypting, or extracting game contents.

## Good First Contributions

- Add or improve an error recipe in `data/error-recipes.json`
- Add or improve an engine rule in `data/engine-rules.json`
- Add clearer wording to beginner-facing diagnosis text
- Improve engine fingerprints using filenames and folder structure only
- Improve commercial/self-developed engine startup-route heuristics using metadata only
- Improve documentation for archives, disc images, locale, or runtime setup
- Improve ZIP directory preflight while keeping it metadata-only
- Report false positives with a redacted GalAid support summary

See `docs/GOOD_FIRST_ISSUES.md` for starter tasks that are intentionally small and metadata-only.

## Safety Rules

Read `SECURITY.md` and `CODE_OF_CONDUCT.md` before opening issues or pull requests.

Do not include:

- game downloads, serials, cracks, DRM bypasses, or decryption instructions
- copyrighted game files, scripts, CG, audio, video, or extracted assets
- private absolute paths, real names, email addresses, machine names, or access tokens
- advice that asks GalAid to install software, edit registry settings, mount images, or run games automatically

Prefer:

- short redacted error messages
- relative paths from GalAid reports
- safe local next steps such as "extract all parts first" or "install the official runtime"
- metadata-only examples
- ZIP central-directory examples that do not extract or include game files
- commercial VN structure examples that avoid naming or bundling copyrighted game contents

## Add an Error Recipe

1. Edit `data/error-recipes.json`.
2. Keep the rule narrow. Use distinctive DLL names, engine names, or error phrases.
3. Add a clear `cause`, one safe `action`, and a short `checklist`.
4. Run:

```bash
npm run build:recipes
npm run check
```

5. Open the web app and paste a sample redacted error into the error box.
6. Confirm the `报错` tab matches the intended recipe and does not create noisy unrelated matches.

`src/error-recipes.js` is generated from JSON so users can still open `index.html` directly. Do not edit that generated file by hand.

## Add an Engine Rule

1. Edit `data/engine-rules.json`.
2. Use metadata-only matchers such as extensions, exact filenames, relative path fragments, or narrow regular expressions.
3. Keep commercial/self-developed engines generic unless public filenames clearly identify a known engine.
4. Run:

```bash
npm run build:engines
npm run check
```

5. Open the web app or desktop beta with a redacted sample folder and confirm the engine tab and roadmap stay useful.

`src/engine-rules.js` is generated from JSON so users can still open `index.html` directly. Do not edit that generated file by hand.

## Pull Request Checklist

- The change stays metadata-only and local-first.
- `npm run check` passes.
- `npm run test:smoke` passes when the change touches browser behavior.
- New recipe patterns compile and avoid broad words that would match too often.
- New engine rules stay narrow and do not require reading file contents.
- Any pasted logs are redacted.
- Docs mention safe official prerequisites, not unofficial downloads or bypasses.

GitHub Actions runs `npm run check` and `npm run test:smoke` on pull requests and pushes to `main`. That covers generated recipe freshness, GitHub template sanity checks, Pages source checks, JavaScript syntax checks, and the built-in browser sample flow. The Pages workflow also runs `npm run build:pages` before publishing the static demo.

Before a public release, run `npm run audit:release -- --strict` after replacing placeholder URLs. The audit checks for private absolute paths, likely secret assignments, internal AI wording, and unsafe crack or bypass advice.
