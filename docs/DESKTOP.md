# Desktop Builds

GalAid can run as a static web app or as an Electron desktop beta. The desktop build keeps the same local-first safety boundary, but it can use native folder/file pickers and recursive local scanning.

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

## Release Checklist

```bash
npm run check
npm run audit:release -- --strict
```

The desktop package includes the app UI, generated rule files, JSON rule sources, desktop bridge files, README, and license. It must not include game files, extracted assets, private paths, tokens, or unofficial bypass instructions.
