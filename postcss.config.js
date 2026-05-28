// Tailwind v4 — autoprefixer ist nicht mehr nötig, der v4-Plugin handhabt
// Vendor-Prefixes selbst über Lightning CSS.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
