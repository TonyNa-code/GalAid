# Desktop Builds

GalAid can run as a static web app or as an Electron desktop beta. The desktop build keeps the same local-first safety boundary, but it can use native folder/file pickers and recursive local scanning.

The Windows desktop beta can also launch trusted local `.exe/.com` entries that GalAid just scanned. Launching is always user-initiated: the user clicks `Launch`, GalAid verifies the path is in the latest scan allowlist, then starts it with the entry folder as the working directory.

The profile tab can create a `.lnk` shortcut for the same allowlisted entry. GalAid also keeps a small local recent-launch history with entry names, relative paths, and timestamps so users can see what they tried without adding those details to reports or support bundles.

## Run Locally

```bash
npm install
npm start
```

## Windows Portable Build

The release workflow builds a portable Windows `.exe` on GitHub Actions:

- workflow: `.github/workflows/desktop-release.yml`
- trigger: manual `workflow_dispatch` or a `v*` tag
- command: `npm run dist:win`
- output: `dist/desktop/*.exe`

The package uses `electron-builder` with a portable x64 Windows target. It does not ask for administrator privileges.

## One-Click Launch Boundary

- Only Windows `.exe/.com` entries are launchable in V1.
- The path must come from the latest desktop scan result.
- Shortcut creation uses the same latest-scan allowlist and writes a normal Windows `.lnk` only after the user chooses the save location.
- Recent-launch history is local app data and is not included in exported reports or support ZIPs.
- GalAid does not add hidden arguments, bypass checks, patch files, or run installers automatically.
- Web mode cannot launch local programs because browsers intentionally block that ability.

## Release Checklist

```bash
npm run check
npm run audit:release -- --strict
```

The desktop package includes the app UI, generated rule files, JSON rule sources, desktop bridge files, README, and license. It must not include game files, extracted assets, private paths, tokens, or unofficial bypass instructions.
