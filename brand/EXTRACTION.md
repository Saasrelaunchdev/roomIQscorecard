# Design system extraction: RoomIQ

Drafted 2026-11-24. Review it: fix brand.json where the evidence says otherwise, then build the tokens (brand-tokens.mjs) and look at the result.

## Sources
- Repository `/home/user/RoomIQproductionlandingpage`: 450 files
- Repository `/home/user/RoomIQGTMWalkthrough`: 4 files
  - 6 style, markup, theme and SVG files read; 442 CSS variables; 3 @font-face rules; 2 files with logo symbols

## Name
- RoomIQ (from /home/user/RoomIQproductionlandingpage/index.html (og:site_name))

## Colors
- primary: #00B4D8 (score 29.9: --c-primary-400, --c-accent, --c-logo-accent, --cyan)
- ink: #03045E (score 51.5: --c-ink-950, --c-heading, --c-logo-ink, --navy)
- signal: #F2B442 (score 12.3: --c-signal-300, --c-signal)
- dark ground: #03045E
- dark: kept the landing page's surface #0A0F6B, surface-2 #131B77, line-strong #3A4596, text-2 #C3C7D1, accent-text #83D5EE (the generated value differed)
- ramps: all 52 steps match `/home/user/RoomIQproductionlandingpage/index.html` exactly

| Color | Uses | OKLCH L | C | On white | Named |
|---|---|---|---|---|---|
| #FFFFFF | 119 | 1.00 | 0.000 | 1.00 | --c-bg, --c-screen, --c-on-accent |
| #03045E | 33 | 0.22 | 0.146 | 17.75 | --c-ink-950, --c-heading, --c-shadow |
| #000000 | 27 | 0.00 | 0.000 | 21.00 |  |
| #0077B6 | 15 | 0.55 | 0.131 | 4.87 | --c-accent-fill-2, --blue, --btn |
| #00B4D8 | 13 | 0.71 | 0.129 | 2.46 | --c-primary-400, --c-accent, --c-logo-accent |
| #010041 | 11 | 0.17 | 0.117 | 19.49 | --c-ink-975, --c-text, --c-device |
| #0B1450 | 9 | 0.23 | 0.109 | 17.07 |  |
| #F2B442 | 5 | 0.81 | 0.144 | 1.84 | --c-signal-300, --c-signal |
| #129E7B | 5 | 0.62 | 0.121 | 3.39 | --g-buyer |
| #D6457F | 5 | 0.61 | 0.187 | 4.19 | --g-money |
| #E0662F | 4 | 0.65 | 0.167 | 3.44 | --g-market |
| #FAFCFF | 3 | 0.99 | 0.005 | 1.03 | --c-ink-25, --c-neutral-25, --c-surface |
| #081980 | 3 | 0.30 | 0.169 | 14.37 | --c-ink-900 |
| #00667B | 3 | 0.47 | 0.085 | 6.59 | --c-primary-700, --c-accent-text, --c-focus |
| #F4F7FE | 3 | 0.98 | 0.010 | 1.07 | --c-neutral-50, --c-surface-2 |
| #EBEEF6 | 3 | 0.95 | 0.011 | 1.16 | --c-neutral-100, --c-line |

## Fonts
- display (headings): Bricolage Grotesque
- text (body): Instrument Sans
- display: Bricolage Grotesque from `/home/user/RoomIQproductionlandingpage/fonts/bricolage-grotesque-latin-opsz-normal.woff2` (variable, weights 200 800)
- text: Instrument Sans from `/home/user/RoomIQproductionlandingpage/fonts/instrument-sans-latin-wght-normal.woff2` (variable, weights 400 700)
- @font-face families seen: Bricolage Grotesque, Instrument Sans, Figtree
- Fontsource packages: none; Google Fonts: none

## Logos
- lockup (the header, the share image): assets/logo/lockup-on-light.svg from `/home/user/RoomIQproductionlandingpage/index.html` (symbol #logo-h), 136x30
- for dark grounds (the footer): assets/logo/lockup-on-dark.svg (made here)
- mark (the report, the favicon): assets/logo/mark.svg from `/home/user/RoomIQproductionlandingpage/index.html` (symbol #logo-mark)
- favicon: assets/logo/favicon.svg
- made: lockup-on-dark: the lockup's word swapped to white; look at it
- every candidate: #logo-mark 26x26, #logo-h 136x30, #rq-mark 64x64

## Share image
- assets/og.png from `/home/user/RoomIQproductionlandingpage/og.png`

## Pictures (largest first)
- `/home/user/RoomIQproductionlandingpage/media/rooms-segments-1720.webp` 1720x822, 41 KB
- `/home/user/RoomIQproductionlandingpage/media/rooms-segments-1600.webp` 1600x765, 39 KB
- `/home/user/RoomIQproductionlandingpage/media/story-film/roomiq-story-poster.webp` 1280x720, 54 KB
- `/home/user/RoomIQproductionlandingpage/media/rooms-windows-1720.webp` 1720x472, 43 KB
- `/home/user/RoomIQproductionlandingpage/media/real07-windows-1444.webp` 1444x543, 41 KB
- `/home/user/RoomIQproductionlandingpage/media/rooms-segments-1280.webp` 1280x612, 29 KB
- `/home/user/RoomIQproductionlandingpage/media/rooms-windows-1600.webp` 1600x439, 40 KB
- `/home/user/RoomIQproductionlandingpage/media/real07-windows-1280.webp` 1280x481, 36 KB
- `/home/user/RoomIQproductionlandingpage/media/location-supply-960.webp` 960x617, 25 KB
- `/home/user/RoomIQproductionlandingpage/media/demo/corner-house-840.webp` 840x630, 54 KB
- `/home/user/RoomIQproductionlandingpage/media/demo/garden-house-840.webp` 840x630, 97 KB
- `/home/user/RoomIQproductionlandingpage/media/demo/porch-house-840.webp` 840x630, 80 KB
- `/home/user/RoomIQproductionlandingpage/media/rooms-evidence-1720.webp` 1720x266, 26 KB
- `/home/user/RoomIQproductionlandingpage/media/rooms-windows-1280.webp` 1280x351, 30 KB
- `/home/user/RoomIQproductionlandingpage/media/rooms-segments-960.webp` 960x459, 19 KB
- `/home/user/RoomIQproductionlandingpage/media/real07-evidence-1444.webp` 1444x298, 22 KB
- `/home/user/RoomIQproductionlandingpage/media/location-supply-800.webp` 800x514, 21 KB
- `/home/user/RoomIQproductionlandingpage/media/rooms-evidence-1600.webp` 1600x247, 25 KB
- `/home/user/RoomIQproductionlandingpage/media/real07-windows-960.webp` 960x361, 24 KB
- `/home/user/RoomIQproductionlandingpage/media/real07-evidence-1280.webp` 1280x264, 20 KB

## Live page
- not read

## Check before building
- The primary is the color the brand acts with (its buttons and links), not a decoration.
- The ink is the dark of the headings or the wordmark, dark enough for 7:1 body text.
- The signal is a warm accent used sparingly (one warning per screen), not a second brand color.
- Both fonts have files (or fonts.mjs fetches them) before the build; a single-weight display file means faux bold.
- The lockup reads on white and the dark version on the footer's ink; open both.
