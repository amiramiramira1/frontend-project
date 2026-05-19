/**
 * HOME PAGE STATISTICS — single source of truth for business metrics.
 *
 * The raw numbers here are injected into locale strings via i18next interpolation:
 *   en.json: "stat1Val": "{{count}}+"   → "500+"
 *   ar.json: "stat1Val": "+{{count}}"   → "+500"
 *
 * To update a metric, change it here only — both languages update automatically.
 */
export const HOME_STATS = [
  { countKey: 'home.stat1Val', labelKey: 'home.stat1Label', count: 500 },
  { countKey: 'home.stat2Val', labelKey: 'home.stat2Label', count: 12  },
  { countKey: 'home.stat3Val', labelKey: 'home.stat3Label', count: null }, // range, no interpolation
];

// Delivery range — rendered as-is from locale (already locale-specific: "3-5" / "3-5")
// Step numbers are in locale files because they use Eastern Arabic numerals (١, ٢, ...)
// in Arabic, which is genuine locale formatting, not data.
