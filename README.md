# Mullusi Docs

Purpose: public technical documentation source for Mullusi systems, architecture, APIs, and tutorials.
Governance scope: public explanation, developer onboarding, architecture contracts, and launch-safe research boundaries.
Dependencies: `mullusi/mullusi-site`, future `mullusi/mullu-control-plane`, GitHub Pages or Cloudflare Pages.
Invariants: public docs contain no secrets, no private roadmap claims, and no unsupported production guarantees.

## Source Of Truth

This repository is the controlled source for `docs.mullusi.com`.

```text
mullusi/mullusi-docs
  -> static docs package
  -> GitHub Pages or Cloudflare Pages
  -> docs.mullusi.com
```

## Structure

```text
.
|-- index.html
|-- CNAME
|-- robots.txt
|-- sitemap.xml
|-- assets/
|   |-- search.js
|   `-- styles.css
|-- data/
|   `-- search-index.json
|-- docs/
    |-- architecture.html
    |-- api.html
    |-- governance.html
    |-- mfidel.html
    |-- search.html
    `-- tutorials.html
`-- scripts/
    `-- validate-docs.mjs
```

## Documentation Boundaries

| Area | Status | Rule |
| --- | --- | --- |
| Architecture | Public-safe | Describe contracts and layers, not private implementation details |
| API | Draft | Mark unstable interfaces clearly |
| Tutorials | Draft | Keep examples deterministic and reproducible |
| Governance | Public-safe | Explain verification and constraint discipline |
| Mfidel | Public-safe | Preserve atomic fidel rules; no decomposition model |

## Local Preview

```bash
python3 -m http.server 8081
```

Then open `http://localhost:8081`.

## Validation

```bash
node --check assets/search.js
node scripts/validate-docs.mjs
```

The validation script checks required files, local links, search-index targets, sitemap targets, public-safe text, and secret-like patterns.

## Update Discipline

1. Update docs in small commits.
2. Keep public claims traceable to working code, examples, or explicit roadmap state.
3. Do not commit secrets, credentials, private costs, or internal-only plans.
4. Verify links and page load before deploy.
