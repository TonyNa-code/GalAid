# Safety and Project Boundaries

GalAid is a diagnostics tool, not a piracy tool.

## Allowed Scope

- Inspect local file names, paths, extensions, and sizes
- Identify likely launchers and setup tools
- Generate local launch profiles that the user can inspect before using
- Detect common visual novel engine markers
- Explain common runtime errors
- Explain likely runtime prerequisites and environment checks
- Generate a local diagnosis report
- Preview or list assets only when the format is open or user-controlled

## Out of Scope

- Providing copyrighted games or assets
- Circumventing DRM
- Sharing cracks, serials, patches, or bypass instructions
- Decrypting protected archives without permission
- Uploading user game files to a third-party server
- Installing system runtimes, changing locale settings, mounting images, or running executables automatically

## Default Privacy Model

The web MVP runs entirely in the browser. It only sees files the user explicitly selects or drops into the page.

The app currently reads:

- file name
- relative path
- file size
- extension

The app does not read file contents for diagnosis in the MVP.

## Desktop Beta Guardrails

The desktop beta can use the native file picker and recursively scan folders. It may see absolute local paths internally so future launch profiles can be built, but the default UI and Markdown report use relative paths.

The desktop beta should keep these defaults:

- no telemetry by default
- no auto-uploaded reports
- no background process scanning unrelated folders
- clear confirmation before opening external tools
- visible warnings before running executables
- launch profiles should stay inspectable and should not auto-run by default
