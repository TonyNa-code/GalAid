# Safety and Project Boundaries

GalAid is a diagnostics tool, not a piracy tool.

## Allowed Scope

- Inspect local file names, paths, extensions, and sizes
- Identify likely launchers and setup tools
- Generate local launch profiles that the user can inspect before using
- Detect common visual novel engine markers
- Explain common runtime errors
- Match pasted error text against local advisory recipes
- Explain likely runtime prerequisites and environment checks
- Generate a local next-step roadmap without changing system settings
- Generate a local diagnosis report
- Generate a local support ZIP containing diagnosis metadata only
- Preflight ZIP/RAR/7z package metadata and disc-image media roles in the desktop beta before any extraction or mounting
- Extract ZIP/RAR/7z packages locally only after the user explicitly chooses an output folder and supplies any known password
- Mount Windows `.iso` images or best-effort extract supported disc images only after the user explicitly clicks the desktop prepare action
- Unmount ISO images that GalAid mounted in the current desktop session after the user explicitly clicks the cleanup action
- Record user-marked launch outcome symptoms without monitoring the game process
- Preview or list assets only when the format is open or user-controlled

## Out of Scope

- Providing copyrighted games or assets
- Circumventing DRM
- Sharing cracks, serials, patches, or bypass instructions
- Decrypting protected archives without permission
- Uploading user game files to a third-party server
- Installing system runtimes, changing locale settings, mounting/extracting images without a user launch/prepare click, extracting archives without a user launch/prepare click, or running executables outside the allowlisted launch flow
- Monitoring or inspecting a running game process

## Default Privacy Model

The web MVP runs entirely in the browser. It only sees files the user explicitly selects or drops into the page.

The app currently reads:

- file name
- relative path
- file size
- extension

The app does not read file contents for diagnosis in the MVP.

Support bundles follow the same privacy model. They contain reports, matched rules, launch hints, and relative-path metadata, but not game files or file contents. The support tab previews the included file list before download.

Desktop package preflight reads metadata only. ZIP is parsed from the archive directory table, RAR/7z can be listed through the bundled or local 7z-compatible command when available, and disc images are treated as media/descriptor files.

Desktop package preparation is separate from preflight. It only starts after a user launch/prepare click, uses an automatic sibling `*-prepared` folder for the one-stop flow or a user-selected output folder for the manual prepare flow, accepts a password the user already knows, and immediately rescans the prepared folder or mounted image. GalAid does not save package passwords, crack passwords, upload package contents, silently mount disc images, or run executables outside the allowlisted launch flow.

Desktop ISO cleanup is also allowlisted. GalAid can only request `Dismount-DiskImage` for an image it mounted during the current app session. Launch follow-up remains manual: the user marks symptoms after trying a launcher, and GalAid uses those choices only to update local diagnosis output.

## Desktop Beta Guardrails

The desktop beta can use the native file picker and recursively scan folders. It may see absolute local paths internally so future launch profiles can be built, but the default UI and Markdown report use relative paths.

The desktop beta should keep these defaults:

- no telemetry by default
- no auto-uploaded reports
- no background process scanning unrelated folders
- clear confirmation before opening external tools
- visible warnings before running executables
- launch profiles should stay inspectable and should not auto-run by default

## Error Recipe Guardrails

Error recipes are local advisory rules. They should explain likely causes and safe next steps, but they must not point users toward cracks, DRM bypasses, serials, decryption keys, or unauthorized asset extraction.
