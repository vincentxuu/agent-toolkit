# Playwright video evidence

Use this reference for browser-visible acceptance criteria. The goal is a repeatable test plus a reviewable recording, not a decorative screen capture.

## Reuse the target project

Before editing tests, inspect:

- Playwright dependency and version;
- `playwright.config.*` and test directory;
- `webServer`, `baseURL`, projects, devices, retries, and output directory;
- fixtures for authentication, seed data, network mocking, and cleanup;
- repository commands and CI artifact conventions.

Use the project's package manager and focused test command. Do not create a second Playwright installation or replace its configuration merely to enable video.

Determine whether the flow exercises real application contracts or only mocked/local UI state. Mocked tests can prove presentation logic but cannot prove storage, API, worker, queue, permission, or generated-client integration. Label the boundary and add a real integration scenario when the acceptance criterion spans those layers.

## Evidence test pattern

Apply video to the focused evidence test or its dedicated file:

```ts
import { test, expect } from '@playwright/test';

test.use({
  video: 'on',
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure',
});

test('editor saves and reloads the title', async ({ page }) => {
  await page.goto('/articles/example');
  await page.getByLabel('Title').fill('Updated title');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Title')).toHaveValue('Updated title');
});
```

Adapt selectors and assertions to the real accessibility tree. Avoid arbitrary timeouts, coordinates, CSS implementation selectors, or a test that only records navigation.

Video is finalized when the browser context closes, normally at test completion. Do not search for or copy it while the test is still running.

## Run and retain evidence

1. Make the test state deterministic and isolate data per run.
2. Run the smallest command that executes the evidence scenario.
3. Require exit code zero.
4. Locate the `.webm` attachment under the configured Playwright output directory.
5. Run `scripts/verify-playwright-video.mjs` against the file or directory.
6. Visually inspect playback when the host supports it.
7. Retain the accepted video under the repository's artifact convention or `.agent-toolkit/evidence/<feature>/<run-id>/`.
8. When a JSON reporter is configured, require at least one expected test with zero unexpected or flaky results and match video attachments to the passing scenario.
9. Record the command, exit code, test name, browser/project, artifact path, byte size, SHA-256, structural validation, duration probe status, and visual-review status.

If the test retries, do not present a failed-attempt recording as passing evidence. Match the accepted video to the passing test result and record the retry context.

## Evidence quality gates

The recording must show the user-relevant sequence and final visible outcome. The test assertion must prove the state; the video lets a human review the interaction.

Also capture browser `pageerror` and relevant console errors when the repository has suitable fixtures. Network, application-log, and trace attachments strengthen diagnosis but can contain secrets; sanitize them before retention or upload.

For security or privacy invariants, use a unique sentinel and verify absence or presence as required across DOM, request/response bodies, console, trace attachments, application logs, and persisted state. React escaping or a hidden element does not make private content safe to expose.

Reject or re-record when:

- the test failed, skipped, or only passed after an unexplained retry;
- the video is absent, empty, structurally invalid, or belongs to another test;
- authentication or seed state leaked private data;
- the important outcome occurs off-screen or after recording ends;
- the recording exposes tokens, personal data, internal URLs, or unrelated user content;
- the flow depends on uncontrolled production state.

Redact through deterministic test data and isolated environments, not by editing a recording in a way that obscures what was tested.

## CI

When CI evidence is requested, upload the Playwright output or accepted evidence directory even on test failure, subject to repository policy. Use short retention for potentially sensitive recordings. A configured upload step does not prove that a current run produced an artifact; cite the actual run and artifact.

Prefer `if: always()`, a run/project-specific artifact name, explicit retention, and `if-no-files-found: error` when the CI provider supports those controls. An upload step alone does not enable Playwright recording.

## Application lifecycle

Reuse the repository's `webServer` or test harness. When the flow needs several services, verify each service's readiness instead of treating one open UI port as proof that APIs or workers are ready. Ensure spawned processes are cleaned up on success, failure, timeout, and interruption; do not terminate unrelated processes that happened to reuse a port.

Use a unique run namespace, disposable users, and isolated databases, schemas, queues, buckets, or logical namespaces. Default test services to loopback and require explicit opt-in for remote targets. Record baseline identifiers before the run, track created resources, and perform cleanup in a `finally` path that still runs after response parsing or assertions fail. Independently query the underlying systems for zero residual rows, jobs, files, sessions, and spawned services rather than writing an unconditional `cleaned: true`. Wait for asynchronous response/log evidence to finish before evaluating it.

Keep allowlists narrow: match known error path, status, and message instead of suppressing all console errors or all 404 responses.

## Fallback boundary

- Browser surface + Playwright unavailable: blocker unless the user authorizes adding it or accepts another verification method.
- Browser surface + recording unavailable: blocker for the video requirement; a screenshot is supplementary only.
- Backend, CLI, library, or documentation-only change: mark video `N/A` and explain why no browser acceptance criterion exists.
- Video structurally validated but no playback tool: report “not visually reviewed”; do not claim visual correctness.
