# Security Policy

GalAid is a local-first diagnostics tool. The web app reads browser-exposed file metadata only, and the desktop beta scans local paths to build metadata reports. GalAid must not upload, execute, modify, decrypt, or extract game files.

## Supported Versions

Security fixes target the current `main` branch until versioned releases begin.

## Report a Vulnerability

For sensitive issues, use GitHub private vulnerability reporting if it is enabled on the repository.

If private reporting is not available, open a public issue with only a minimal description and no exploit details. A maintainer can move the discussion to a private channel.

Please do not attach:

- game files, extracted scripts, CG, audio, video, cracks, serials, or bypass tools
- private absolute paths, usernames, machine names, emails, tokens, or logs with secrets
- full crash dumps or archives that include user data

Good reports include:

- affected surface: web app, desktop beta, support bundle, error recipes, or GitHub Pages demo
- exact GalAid version or commit
- minimal reproduction steps using metadata-only examples
- why the issue could expose data, execute code, or weaken the local-only boundary

## Security Boundary

Expected behavior:

- reports and support bundles contain metadata only
- browser mode uses relative paths exposed by the file picker
- desktop mode may see absolute paths while scanning, but exported reports should omit them
- rules and recipes provide safe local advice only

Out of scope:

- requests for game downloads, cracks, DRM bypasses, serials, or decryption
- requests to extract copyrighted assets from third-party games
- reports that require sharing proprietary game content
