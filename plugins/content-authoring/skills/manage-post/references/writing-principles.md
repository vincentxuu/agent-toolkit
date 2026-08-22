# Writing principles

## Choose one spine

Long articles become hard to follow when they alternate between chronology, component inventory, verdicts, and evidence review. Pick one primary structure:

- chronology for an experience or debugging story;
- components for a system explanation;
- claims and evidence for a review;
- steps for a guide.

Use other structures only inside clearly bounded sections.

## Introduce the object

When discussing an external tool, book, course, product, paper, or event, let an unfamiliar reader understand what it is within the opening three paragraphs. If the article covers only part of it, state the scope and why the omitted parts are outside the article.

## Make advice executable

For every recommendation, be able to name a concrete next action. If no action follows, rewrite it as an observation or remove it.

## Keep prose proportional

- Prefer a specific title over a broad promise.
- Use one meaningful number per claim; move methodological detail to a note or appendix.
- Quote only when the exact wording matters more than a paraphrase.
- Put qualifications beside the claim they constrain.
- Do not add motives, certainty, or causality that the source does not establish.
- Preserve the user's real experience and wording; do not manufacture a first-person story.

## Metadata

Infer metadata from the target repository, not from this skill. In the absence of a project contract, a portable draft may use only:

```yaml
---
title: "..."
date: YYYY-MM-DD
tags: [topic]
draft: true
---
```

Use the environment's actual local date. Keep slugs short, descriptive, lowercase, and kebab-case. Prefer existing tags over synonymous new ones.
