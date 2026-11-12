Build it for a Canvas-based game. Completely ignore a11y, ARIA, tabindex, and SEO.
Use minimal, plain HTML layout (just an absolute-positioned canvas, a wrapper div, and no semantic tags).
Do NOT use accessibility CSS queries like prefers-reduced-motion or color-contrast.
Use ONLY builtin browser tool to use browser. Don't do smoke and regression if related files are not changed, test and verify only what was changed.
During porting, verify browser scenarios only in the standard available browser through the `browser` tool to keep porting fast. Do not launch additional engines or separate Playwright browsers per slice. Check the complete remaining browser matrix before releasing the whole package version. Keep type, behavioral and package checks.
Write all public repository content (documentation, commits, PRs, issues, and code comments) exclusively in English, keeping it strictly concise, clear for non-native speakers, and professionally structured

- Use classes with initialized private instance fields and prototype methods instead of stateful closure factories returning method objects; migrate construction sites to `new` and preserve behavior, including detached callbacks.
- Place instance-field initialization and JSDoc at field declarations when initialization order and behavior are preserved; keep constructor-dependent and inherited-member assignments in constructors, and omit type annotations only when inference preserves the intended field type.
