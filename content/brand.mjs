// The brand: its names, logo, fonts, the report's pictures, and the few colors that live outside the stylesheet (the
// emails and the share image). Read by the build, the server, the report and the admin, so no code names a company.
// The skill writes this file from the design system it extracts (brand/brand.json); the stylesheet's colors are in
// src/styles/tokens.css, written from the same brand.json (scripts/brand-tokens.mjs). This copy is the worked example:
// Rempo, the brand the template was first built for.
export default {
  name: "RoomIQ", // page titles ("... | Rempo"), the emails, the report's cover and toolbar, the admin
  slug: "roomiq-first-deal", // a machine prefix: the admin's cookie, the analytics' dataLayer events, the calendar file's name
  homeLabel: "roomiq.io", // the words on links back to the main site (content/site.mjs masterUrl)

  // Files in src/assets/. The lockup (mark and name) sits in the header and on the share image; the version for dark
  // grounds in the footer; the mark alone on the report (cover, section kickers, the toolbar). width and height are the
  // lockup's viewBox, so the page reserves its space before it loads.
  logo: {
    lockup: "rempo-lockup-on-light.svg",
    lockupOnDark: "rempo-lockup-on-dark.svg",
    mark: "rempo-mark.svg",
    width: 211.2,
    height: 64
  },

  // Self-hosted fonts in src/assets/fonts/: one file per role (a variable woff2 covers every weight). The family
  // names must match --f-display and --f-text in src/styles/tokens.css. A role whose file is missing falls back to
  // the system font.
  fonts: {
    display: { family: "Outfit", file: "display.woff2", weight: "100 900" },
    text: { family: "Geist", file: "text.woff2", weight: "100 900" }
  },

  // The report's pictures, embedded in the PDF: slot -> "<name>-<width>" in src/assets/img/ (a .webp). A slot left
  // out, or a missing file, leaves its picture out. The pages' pictures are found by name (src/assets/img/<name>-<width>.webp,
  // every width present goes into the srcset), as content/*.mjs names them.
  reportImages: {
    cover: "street-six-1200",
    letter: "podium-800",
    quickStart: "toolbox-640",
    next: "team-desk-800"
  },

  // Colors for the places a stylesheet can't reach: the emails (inline styles) and the share image. Keep them equal
  // to the tokens: ink = --c-heading, text = --c-text, muted = --c-ink-600, link = --c-accent-text, accent =
  // --c-accent, onAccent = --c-on-accent, canvas = --c-ink-50, line = --c-ink-100, tint = --c-primary-100.
  colors: {
    ink: "#0A1A33",
    text: "#040F22",
    muted: "#5F7699",
    link: "#0057B3",
    accent: "#1F86FF",
    accent2: "#70ADFF",
    onAccent: "#040F22",
    canvas: "#F3F7FC",
    line: "#E8EFF9",
    tint: "#E4F0FF",
    // The drawings' roles (lib/icons.mjs PAL): line2 = --c-ink-200, ink300/400/500 = --c-ink-300/400/500, signal =
    // --c-signal (the warm accent), star = the rating stars, chart = the one-hue charts' color
    line2: "#D3DFF1",
    ink300: "#B7C9E5",
    ink400: "#94ACD2",
    ink500: "#7990B5",
    signal: "#F5A524",
    star: "#F9CE14",
    chart: "#2A78D6"
  }
};
