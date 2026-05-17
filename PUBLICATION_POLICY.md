<!--
Purpose: define the public-use boundary for Mullusi documentation source.
Governance scope: public documentation, examples, claims, attribution, and private-information exclusion.
Dependencies: docs.mullusi.com, mullusi/mullusi-site, Mullusi ops authority, and repository validation scripts.
Invariants: public documentation contains no secrets, no private roadmap commitments, and no unsupported production guarantees.
-->

# Publication Policy

This repository is publicly visible because it is the source for
`docs.mullusi.com`. Public visibility is not a blanket release of private
Mullusi operational material.

## Public Boundary

Allowed public content:

1. Architecture contracts that are intended for developer understanding.
2. Public API descriptions that are labeled by maturity.
3. Tutorials that can be reproduced from public source.
4. Governance rules that explain verification, traceability, and constraints.
5. Mfidel documentation that preserves fidel atomicity and avoids decomposition models.

Blocked public content:

1. Production secrets, credentials, private keys, cookies, or provider tokens.
2. Private roadmap details that are not approved for public release.
3. Internal cost, account, or vendor-control details.
4. Unsupported production guarantees.
5. Ethiopian script processing that decomposes fidel into root-letter or Unicode-normalized units.

## Claim Discipline

Every public technical claim must be one of:

| Claim type | Requirement |
| --- | --- |
| Implemented | Linkable to source, test, workflow, or live surface |
| Draft | Marked as draft or unstable |
| Roadmap | Marked as planned and not production-ready |
| Research | Framed as research, not a deployed guarantee |

## Reuse Boundary

Code snippets that appear in tutorials are intended for reader execution in the
documented context. Broader reuse, redistribution, or product incorporation is
not granted by this policy alone. Add an explicit license file before making a
broader reuse grant.

## Verification

Run before publishing documentation changes:

```bash
node --check assets/search.js
node scripts/validate-docs.mjs
```

For launch-facing claims, also record the relevant ops verifier result.
