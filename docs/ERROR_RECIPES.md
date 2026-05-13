# Error Recipe Guide

GalAid keeps common startup-error rules in `src/error-recipes.js`.

Each recipe is advisory. It should help the user understand the likely cause and the next safe local action. It must not include download links to games, cracks, bypass tools, serials, or decryption instructions.

## Recipe Shape

```js
{
  id: "directx-legacy",
  title: "DirectX old components",
  category: "runtime",
  level: "warning",
  patterns: ["d3dx\\d+_\\d+\\.dll", "xinput1_3\\.dll"],
  cause: "Short explanation of why this error happens.",
  action: "One clear next step.",
  checklist: ["Step one", "Step two"]
}
```

## Field Notes

- `id`: stable kebab-case key.
- `title`: short user-facing diagnosis label.
- `category`: broad group such as `runtime`, `locale`, `files`, `package`, `web`, `engine`, or `system`.
- `level`: usually `warning`; use `info` only for low-risk observations.
- `patterns`: JavaScript regular-expression strings. They are compiled case-insensitively by default.
- `cause`: what is probably wrong.
- `action`: the safest next step.
- `checklist`: short local steps the user can try.

## Contribution Checklist

- Keep the rule narrow enough to avoid noisy matches.
- Prefer exact DLL names, engine names, or distinctive phrases.
- Explain prerequisites without pretending GalAid can install them.
- Keep advice local-first and non-destructive.
- Do not add piracy, DRM bypass, cracking, or decryption instructions.
- Run `npm run check` after editing recipes.
