# Contributing to GalAid

Thanks for helping make visual novel launch issues less painful.

GalAid is local-first and safety-focused. Contributions should help users diagnose legally obtained local folders without uploading, executing, modifying, decrypting, or extracting game contents.

## Good First Contributions

- Add or improve an error recipe in `data/error-recipes.json`
- Add clearer wording to beginner-facing diagnosis text
- Improve engine fingerprints using filenames and folder structure only
- Improve documentation for archives, disc images, locale, or runtime setup
- Report false positives with a redacted GalAid support summary

## Safety Rules

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

## Pull Request Checklist

- The change stays metadata-only and local-first.
- `npm run check` passes.
- New recipe patterns compile and avoid broad words that would match too often.
- Any pasted logs are redacted.
- Docs mention safe official prerequisites, not unofficial downloads or bypasses.

GitHub Actions runs `npm run check` on pull requests and pushes to `main`. That covers generated recipe freshness, template sanity checks, and JavaScript syntax checks.
