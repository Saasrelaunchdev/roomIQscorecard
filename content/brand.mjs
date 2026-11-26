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
    lockup: "roomiq-first-deal-lockup-on-light.svg",
    lockupOnDark: "roomiq-first-deal-lockup-on-dark.svg",
    mark: "roomiq-first-deal-mark.svg",
    width: 134,
    height: 30
  },

  // Self-hosted fonts in src/assets/fonts/: one file per role (a variable woff2 covers every weight). The family
  // names must match --f-display and --f-text in src/styles/tokens.css. A role whose file is missing falls back to
  // the system font.
  fonts: {
    display: { family: "Bricolage Grotesque", file: "display.woff2", weight: "200 800" },
    text: { family: "Instrument Sans", file: "text.woff2", weight: "400 700" }
  },

  // The report's pictures, embedded in the PDF: slot -> "<name>-<width>" in src/assets/img/ (a .webp). A slot left
  // out, or a missing file, leaves its picture out. The pages' pictures are found by name (src/assets/img/<name>-<width>.webp,
  // every width present goes into the srcset), as content/*.mjs names them.
  // The report's pictures: the story film's poster (an illustrated, made-up neighborhood) on the cover; no others
  reportImages: {
    cover: "neighborhood-1280",
    letter: null,
    quickStart: null,
    next: null
  },

  // Colors for the places a stylesheet can't reach: the emails (inline styles) and the share image. Keep them equal
  // to the tokens: ink = --c-heading, text = --c-text, muted = --c-ink-600, link = --c-accent-text, accent =
  // --c-accent, onAccent = --c-on-accent, canvas = --c-ink-50, line = --c-ink-100, tint = --c-primary-100.
  colors: {
    ink: "#03045E",
    text: "#010041",
    muted: "#456CD6",
    link: "#00667B",
    accent: "#00B4D8",
    accent2: "#0077B6",
    onAccent: "#FFFFFF",
    canvas: "#F3F7FF",
    line: "#E7EFFF",
    tint: "#D9F4FC",
    line2: "#CFDEFF",
    ink300: "#AEC7FF",
    ink400: "#83A8FF",
    ink500: "#5E88F5",
    signal: "#F2B442",
    star: "#F9CE14",
    chart: "#2A78D6"
  }
};
