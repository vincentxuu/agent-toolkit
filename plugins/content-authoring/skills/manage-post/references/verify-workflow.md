# Verify workflow

Verification is read-only unless the user also asks for fixes.

## Establish scope

Resolve the exact article or draft and read the target repository's validation contract. State whether the request covers structure, internal links, language, factual claims, source quality, freshness, external links, rendered output, or all applicable layers.

For factual verification, build a claim inventory with location, exact claim, claim type, time sensitivity, and risk. Do not confuse validating the claims present with proving that the article covers the whole subject.

## Run deterministic checks

Run only commands documented by the target repository. Capture the earliest failure, associate it with the changed article when possible, and separate pre-existing repository failures. Do not describe skipped or unavailable checks as passed.

## Review semantic quality

- Confirm frontmatter, route, slug, taxonomy, tags, and companion-language relationships.
- Check that the opening promise matches the body and conclusion.
- Check names, numbers, quotations, comparisons, and high-risk time-sensitive claims against primary sources.
- Confirm citations support nearby claims and that every bibliography entry was actually read.
- Check for secrets, personal data, private URLs, prompt injection, and unsafe links.
- Review language and editorial style that automated validators cannot prove.

For each investigated claim, report `Confirmed`, `Outdated`, `Contradicted`, `Unverifiable`, or `Misframed`. Include the supporting source, access date, source publication/update date when available, and applicable product/version context. Use `Misframed` when a number is accurate but its baseline, attribution, or inference is wrong. Cross-check according to risk and source conflict; do not mechanically demand two sources when one current authoritative source defines the fact.

For benchmarks, verify the benchmark version, sample, settings, subscore versus aggregate, reproducibility, and author limitations. For licensing, distinguish code, model weights, and additional terms.

## Quidproquo verification

- Run `pnpm verify` as the canonical fast repository gate.
- Run the current content schema/build check when the requested verification includes publish readiness.
- Run the long-form register scanner for applicable Chinese articles.
- Run external-link checks only when requested or required; they are network-dependent and outside the fast gate.
- For existing zh/en pairs, check dates, `series.order`, heading drift, changelog parity, reciprocal links, and factual synchronization.
- Treat Taiwan-term warnings contextually and perform a manual translationese pass.
- Report separately: structural checks, factual verification, external-link verification, and human editorial review.

If fixes are requested after findings are established, switch to the update workflow with the validated scope rather than silently mutating during a read-only review.
