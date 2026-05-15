# Desktop Builds

GalAid can run as a static web app or as an Electron desktop beta. The desktop build keeps the same local-first safety boundary, but it can use native folder/file pickers and recursive local scanning.

The Windows desktop beta can also launch trusted local `.exe/.com` entries that GalAid just scanned. Launching is always user-initiated: the user clicks `Launch`, GalAid verifies the path is in the latest scan allowlist, then starts it with the entry folder as the working directory.

The profile tab can create a `.lnk` shortcut for the same allowlisted entry. GalAid also keeps a small local recent-launch history with entry names, relative paths, and timestamps so users can see what they tried without adding those details to reports or support bundles.

The package tab can prepare ZIP/RAR/7z archives after the user clicks `Extract and rescan`. GalAid asks for an output parent folder, creates a fresh prepared subfolder, passes a user-provided password only to the local extraction attempt, then scans the extracted folder and refreshes launch recommendations.

Disc-image rows can use `Mount/extract and rescan`. On Windows, `.iso` files are mounted with the built-in `Mount-DiskImage` command when available. Other supported image files are handled as a best-effort local extraction through the bundled 7z-compatible helper before GalAid rescans the prepared output folder.

After a package or image is prepared, the launch tab shows a prepared handoff card with the original package, the prepared target, and the top recommended launch entry. On Windows, that handoff card can start the same allowlisted `.exe/.com` entry as the normal launch candidate button.

After a desktop launch action succeeds, the launch tab shows a short follow-up card. Users can mark the game as opened normally or choose a symptom such as no response, immediate crash, missing DLL/runtime, mojibake, or black screen; those symptoms update the roadmap and support bundle without GalAid monitoring the process.

When an ISO was mounted by GalAid, the same handoff card can request a Windows `Dismount-DiskImage` cleanup for that session's mounted image. GalAid only offers this action for images it mounted during the current desktop session.

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
- tag pushes create or update a GitHub pre-release when the tag looks like `alpha`, `beta`, or `rc`, then upload the Windows portable `.exe`
- manual runs can still pass `release_tag` to upload a rebuilt `.exe` to an existing release

The package uses `electron-builder` with a portable x64 Windows target. It does not ask for administrator privileges.

## One-Click Launch Boundary

- Only Windows `.exe/.com` entries are launchable in V1.
- The path must come from the latest desktop scan result.
- Shortcut creation uses the same latest-scan allowlist and writes a normal Windows `.lnk` only after the user chooses the save location.
- Recent-launch history is local app data and is not included in exported reports or support ZIPs.
- Archive extraction requires an explicit user click and a chosen output folder.
- Disc-image mounting or extraction requires an explicit user click.
- Mounted ISO cleanup is limited to images GalAid mounted in the current session.
- Launch follow-up is user-marked; GalAid does not watch or inspect the running game process.
- Package passwords are not saved to reports, support bundles, or launch history.
- GalAid does not add hidden arguments, bypass checks, patch files, or run installers automatically.
- Web mode cannot launch local programs because browsers intentionally block that ability.

## Release Checklist

```bash
npm run check
npm run audit:release -- --strict
```

The desktop package includes the app UI, generated rule files, JSON rule sources, desktop bridge files, the bundled `7zip-bin` package, README, and license. It must not include game files, extracted assets, private paths, tokens, or unofficial bypass instructions.
