// Raw-markdown fixtures for the pure parser/resolver tests. Kept as string constants (not
// .md files) so the tests stay pure — no fs access, no live-brain dependency.

/** A full, valid ticker page mirroring the real `wiki/fdm.md` frontmatter schema. */
export const FULL_VALID_TICKER = `---
ticker: FDM.L
company: FDM Group (Holdings) plc
page_type: ticker
review_type: post_mortem
sector: IT Staffing
industry: Recruit-train-deploy IT consulting
conviction: 1
risk_rating: high
gate: fail
gate_summary: "Operational KPIs were in freefall while the P&L still looked clean; fell ~25%."
signs:
  - {polarity: warning, label: "Year-end consultants -21% while revenue flat"}
  - {polarity: warning, label: "Utilisation 97.5%->92.8%; training completions -58%"}
  - {polarity: encouraging, label: "Fortress balance sheet: net cash, strong OCF"}
related: [sector-it-staffing, signal-headcount-divergence, signal-yield-trap]
sources: [archive/2026-04-02-FDM_Group_Post_Mortem_Analysis.md]
last_updated: 2026-06-07
---

# FDM Group (Holdings) plc — FDM.L

A qualified play that fell ~25% over 12 months. The operational KPIs *are* the fundamentals.
`

/** A file with no frontmatter block at all (test U2). */
export const NO_FRONTMATTER = `# Some loose note

Dropped into the brain without any frontmatter yet. Should still be indexed.
`

/** Frontmatter with broken YAML — an unbalanced flow collection (test U3). */
export const MALFORMED_YAML = `---
ticker: SPSY.L
signs: [{polarity: warning, label: oops]
sector: Security Technology
---

# SPSY — broken frontmatter

The YAML above is invalid; the file must still index without throwing.
`

/** A ticker page carrying qualitative play_tags that must pass through verbatim (test U7). */
export const PLAY_TAGS_PAGE = `---
ticker: SPSY.L
company: Spectra Systems Corporation
page_type: ticker
gate: pass
play_tags: [play, sector_play]
last_updated: 2026-06-07
---

# SPSY.L

Qualitative labels only.
`
