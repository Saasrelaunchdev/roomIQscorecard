# The brand

`brand.json` is the source of the colors, fonts and logos (drafted by the Scorecard Funnel Creator's
extract-design-system.mjs, see EXTRACTION.md). After a change to it:

```bash
node tools/brand/brand-tokens.mjs --brand brand/brand.json --out src/styles/tokens.css --brand-mjs content/brand.mjs --light-only
node tools/make-og.mjs && node tools/build.mjs
```

Fonts: `node tools/brand/fonts.mjs --brand brand/brand.json --dir src/assets/fonts`. The area colors live in
content/scorecard.mjs; check them with `node tools/brand/palette.mjs check "#hex,#hex,..."`.
