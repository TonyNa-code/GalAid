# Engine Rules

GalAid engine clues are metadata-only. Rules may look at filenames, extensions, and relative paths, but they must not require reading, extracting, decrypting, or modifying game contents.

The community rule source is `data/engine-rules.json`. The generated browser file is `src/engine-rules.js`.

## Rule Shape

Each rule has:

- `id`: stable kebab-case key
- `name`: user-facing engine or structure name
- `description`: short contributor-facing note
- `score`: base score, usually `0`
- `match`: metadata matchers
- `advice`: short diagnosis advice shown in the app

Supported `match` fields:

- `extensions`: file extensions without dots, such as `xp3`
- `filenames`: exact filenames, such as `krkr.exe`
- `pathIncludes`: relative path fragments, such as `/scenario/`
- `pathEndsWith`: relative path suffixes, such as `/data/system.json`
- `filenameRegex`: case-insensitive regular expressions for filenames
- `pathRegex`: case-insensitive regular expressions for relative paths
- `dllNameIncludes`: DLL filename fragments used by the commercial/self-developed route

## Edit Flow

```bash
npm run build:engines
npm run check
```

The desktop package preflight reads the same JSON rules for ZIP and optional local RAR/7z metadata listings, so one rule update improves both the web diagnosis and package directory preview.

## Evidence Explanations

The app turns every rule match into a user-facing explanation. A good rule should therefore be narrow enough that its matched extension, filename, path fragment, or DLL clue can be shown as evidence without overstating certainty.

Engine cards show:

- confidence and score
- why the rule matched
- sample metadata paths
- a next step for startup diagnosis

## Safety Notes

- Use fake or redacted sample paths in issues and tests.
- Do not attach game files or extracted scripts/assets.
- Keep private engines generic unless public filenames clearly identify the engine.
- Prefer startup diagnosis advice: complete extraction, correct working directory, locale, and official runtimes.
