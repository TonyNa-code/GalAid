# Desktop Builds

GalAid can run as a static web app or as an Electron desktop beta. The desktop build keeps the same local-first safety boundary, but it can use native folder/file pickers and recursive local scanning.

The Windows desktop beta can also launch trusted local compatible Windows `.exe/.com/.bat/.cmd/.lnk` entries that GalAid just scanned. Launching is always user-initiated: the user clicks `Launch`, GalAid verifies the path is in the latest scan allowlist, checks that the file still exists, then starts it with the entry folder as the working directory. Batch/script entries are opened through `cmd.exe call`, and shortcut entries are opened through the normal Windows shell `start` route. GalAid waits briefly for an immediate Windows spawn failure before it reports the launch as started, so deleted files or association/startup failures do not get recorded as successful launch history.

During native scanning, GalAid reads `.exe/.com` headers and labels DOS COM/MZ, Win16 NE, legacy LE/LX, Win32 PE, and Win64 PE formats. DOS and Win16-style entries are kept out of the direct-launch allowlist and become a legacy runtime route for DOSBox, a 32-bit Windows environment, or a VM-style handoff. Old Win32 PE entries that target Win95/NT4/Win2000/XP through the PE subsystem version stay launchable, but the roadmap adds compatibility-mode guidance for XP SP3/Win98 mode, fullscreen behavior, short paths, and legacy DirectX/runtime/video component checks. PE import hints for DirectDraw, DirectSound, DirectInput, WinMM, VC++ runtime DLLs, VB6, .NET, QuickTime, DirectShow/MCI, Flash/ActiveX, and Borland/Delphi libraries are folded into advisory runtime routes without blocking direct launch.

The profile tab can create a `.lnk` shortcut for normal executable entries. GalAid also keeps a small local recent-launch history with entry names, relative paths, and timestamps so users can see what they tried without adding those details to reports or support bundles.

The launch tab can prepare ZIP/RAR/7z archives, legacy LZH/LHA/ARJ/CAB packages, tar-style packages, and detected self-extracting EXE packages through the one-stop launch button. GalAid creates a fresh sibling `*-prepared` folder, asks for a user-provided password only when needed, expands compressed tar packages such as `.tar.gz/.tgz` in a second pass when an inner `.tar` appears, scans the extracted folder, and launches the top recommended entry when one is found. Self-extracting EXE support is metadata-gated: the desktop scanner must first list the EXE with the bundled or local 7z-compatible helper and see archive entries inside it, so ordinary game launchers stay on the direct-launch route. If the prepared content has no game launcher but does expose `setup.exe`, `install.exe`, `autorun.exe`, `.msi`, or an `autorun.inf` target such as `Start.exe` / `SetupJP.exe` / `Setup.cmd`, including shell install commands, GalAid presents that as a separate install-media entry and can open it from the same one-stop flow. Metadata preflight also recognizes old install-disc layouts such as `autorun.inf + Start.exe + data1.cab`, so likely autorun stubs are not promoted as game launchers before extraction. Windows Installer packages are launched through `msiexec.exe /i`. Package preflight also labels bundled DirectX/VC++/.NET/VB6/QuickTime/RPG Maker RTP repair tools so they are treated as fix clues rather than launch entries, and the package card shows launch, install-media, and runtime-repair samples separately from generic file samples. Support bundles include the same compact package/image preflight view as `package-previews.json`. The package tab still offers `Extract and rescan` for users who want to choose the output parent folder manually.

Disc-image rows can use `Mount/extract and rescan`. On Windows, `.iso` files are mounted with the built-in `Mount-DiskImage` command when available. During scanning, small `.cue` sheets are read for `FILE` track declarations so differently named `.bin/.img` media files can be grouped with the descriptor and missing tracks can be called out before preparation. When the bundled or local 7z-compatible helper can list a supported disc-image directory, GalAid records internal launch, installer, runtime repair, and engine clues without extracting the image. Other supported image files are handled as a best-effort local extraction through the same helper before GalAid rescans the prepared output folder.

After a package or image is prepared, the launch tab shows a prepared handoff card with the original package, the prepared target, and the top recommended launch or install-media entry. On Windows, the one-stop button can start that allowlisted compatible `.exe/.com/.bat/.cmd/.lnk` entry immediately after preparation, and the handoff card can start the same entry again later. Installer/media entries do not create the game-launch follow-up card; the next step is to scan the installed game folder.

After a desktop launch action succeeds, the launch tab shows a short follow-up card. Users can mark the game as opened normally or choose a symptom such as no response, immediate crash, missing DLL/runtime, mojibake, or black screen; those symptoms update the roadmap and support bundle without GalAid monitoring the process.

When the latest error text, launch-failure symptom, or PE import hint points to DirectX, VC++, .NET, VB6, QuickTime, or RPG Maker RTP and a matching repair tool was found in the scanned folder, the one-stop guide promotes that repair tool as the primary next click. Repair tools still use the same allowlisted desktop launch path and stay separate from game launch follow-up state.

The environment tab can run an explicit local runtime check on Windows. It probes for common legacy DirectX DLLs, installed Microsoft Visual C++ Redistributables, .NET Framework registry markers, VB6 runtime DLLs, QuickTime/video component markers, RPG Maker RTP entries, and locale state. The environment page shows the full result, while the roadmap promotes optional runtime gaps only when the current folder, PE imports, engine clues, pasted error, or launch-failure symptoms make that check relevant. The metadata-only result is still stored in reports and support bundles.

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

- Compatible Windows `.exe/.com/.bat/.cmd/.lnk` entries are launchable in V1, and install-media `.msi` entries open through Windows Installer.
- DOS COM/MZ, Win16 NE, and LE/LX legacy executables are detected from headers and routed to old-runtime guidance instead of direct launch.
- Win95/NT4/Win2000/XP-era Win32 PE entries are still direct-launch candidates; the compatibility warning is guidance for failed launches, not a block.
- The path must come from the latest desktop scan result.
- Shortcut creation uses the same latest-scan allowlist and writes a normal Windows `.lnk` only after the user chooses the save location.
- Recent-launch history is local app data and is not included in exported reports or support ZIPs.
- Archive extraction requires an explicit user click and a chosen output folder.
- Disc-image mounting or extraction requires an explicit launch or prepare click.
- Mounted ISO cleanup is limited to images GalAid mounted in the current session.
- Launch follow-up is user-marked; GalAid does not watch or inspect the running game process.
- Runtime environment checks read only system metadata such as registry display names, common runtime DLL presence, and locale names.
- Package passwords are not saved to reports, support bundles, or launch history.
- GalAid does not add hidden arguments, bypass checks, patch files, or run installers automatically.
- Web mode cannot launch local programs because browsers intentionally block that ability.

## Release Checklist

```bash
npm run check
npm run audit:release -- --strict
```

The desktop package includes the app UI, generated rule files, JSON rule sources, desktop bridge files, the bundled `7zip-bin` package, README, and license. It must not include game files, extracted assets, private paths, tokens, or unofficial bypass instructions.
