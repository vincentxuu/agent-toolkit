# Releasing

## Prepare

1. Choose the next Semantic Versioning number.
2. Move relevant entries from `CHANGELOG.md` under a dated version heading.
3. Update every manifest together:

```bash
npm run set-version -- <version>
```

4. Confirm the generated artifacts and checksums under `dist/`:

```bash
npm test
```

5. Run the remaining clean-tree check:

```bash
git diff --check
```

The validator rejects version drift between root metadata, portable and native manifests, and marketplace entries. `npm test` rebuilds standard, Web, Codex, and Claude artifacts under ignored `dist/` and generates `dist/SHA256SUMS`.

## Publish

1. Merge the release change into `main` after CI passes.
2. Create an annotated tag named `v<version>`.
3. Create a GitHub Release from that tag and paste the matching changelog section into the release notes.
4. If distributing host-native archives, generate them from the tagged clean checkout rather than committing `dist/`.

## After release

- Verify the tag and release are publicly readable.
- Install the tagged plugin or skill in each claimed client.
- Open a follow-up issue for any client-specific incompatibility instead of silently changing an existing tag.
