# Contributing

Thanks for improving Agent Toolkit. Contributions should preserve one portable source of truth and keep host-specific behavior isolated.

## Development setup

Requirements:

- Node.js 20 or newer
- Git

Clone the repository and run:

```bash
npm test
```

There are currently no runtime npm dependencies.

## Repository rules

- Put portable plugins under `plugins/<plugin-name>/`.
- Put canonical skills under `plugins/<plugin-name>/skills/<skill-name>/`.
- Put native host metadata under `adapters/<host>/<plugin-name>/`.
- Do not copy or fork `SKILL.md` into an adapter.
- Do not commit credentials, private endpoints, expanded authorization headers, personal paths, generated `dist/`, or `.research/` notes.
- Keep plugin and adapter versions synchronized.

## Adding or changing a plugin

1. Update the portable plugin and its canonical skills.
2. Update only the adapters affected by the change.
3. Add an entry under `CHANGELOG.md`.
4. Run `npm test` on a supported Node.js version.
5. Open a focused pull request describing why the change is needed and how it was verified.

Changes to a complex skill should include a realistic forward test. Keep test prompts neutral: validate the skill's behavior without leaking the expected answer into the prompt.

## Pull requests

- Keep unrelated changes out of the pull request.
- Explain behavior and compatibility changes, not only file changes.
- Update documentation when installation or packaging behavior changes.
- Preserve backward compatibility when practical; clearly identify breaking changes.
- All CI checks must pass before merge.

By contributing, you agree that your contribution is licensed under the repository's MIT License.
