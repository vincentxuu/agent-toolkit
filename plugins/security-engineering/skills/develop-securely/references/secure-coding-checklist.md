# Secure Coding Checklist

Condensed from the [OWASP Secure Coding Practices Quick Reference Guide](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/) and the [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/). Apply only the sections relevant to the change's blast radius (see `SKILL.md` §3); use the linked cheat sheet for implementation detail on any item that applies.

## 1. Input validation

- [ ] Validate on the server/trusted side, never on client-side checks alone.
- [ ] Validate for type, length, format, and range against an allow-list, not a deny-list.
- [ ] Validate all sources equally: query params, headers, cookies, file uploads, deserialized payloads, and data from other services.

## 2. Output encoding

- [ ] Encode output for the context it's rendered in (HTML, HTML attribute, JS, URL, SQL) — one encoder does not cover all contexts.
- [ ] Use the framework's templating auto-escaping rather than hand-built string concatenation for user-influenced output.

## 3. Authentication and password management

- [ ] Enforce authentication on every endpoint that isn't explicitly public.
- [ ] Use a vetted library for password hashing (bcrypt/scrypt/argon2), never a fast general-purpose hash.
- [ ] Rate-limit and lock out on repeated auth failures; return generic errors that don't reveal which factor was wrong.
- [ ] Invalidate sessions/tokens on logout, password change, and privilege change.

## 4. Session management

- [ ] Generate session identifiers with a CSPRNG; rotate on privilege change (login, elevation).
- [ ] Set `Secure`, `HttpOnly`, and an appropriate `SameSite` on session cookies.
- [ ] Enforce absolute and idle session timeouts.

## 5. Access control

- [ ] Check authorization on every request server-side, even when the UI already hides the action — deny by default.
- [ ] Re-check authorization at the resource level (object-level authZ), not just the endpoint level — a valid session for object A must not authorize action on object B.
- [ ] Log authorization failures with enough context to detect probing.

## 6. Cryptographic practices

- [ ] Use vetted libraries and current algorithms; do not implement custom crypto.
- [ ] Never hardcode keys, IVs, or secrets in source; load from a secrets manager or environment at runtime.
- [ ] Use authenticated encryption (e.g., AES-GCM) rather than encryption without integrity protection.

## 7. Error handling and logging

- [ ] Fail closed: an error in a security check must deny the action, not default-allow.
- [ ] Return generic errors to the caller; log full detail server-side only.
- [ ] Never log secrets, tokens, full card numbers, or other sensitive fields — log a redacted reference instead.

## 8. Data protection

- [ ] Classify sensitive data and encrypt it at rest and in transit.
- [ ] Apply least-privilege access to sensitive data stores; avoid broad service-account grants.
- [ ] Scrub sensitive data from caches, temp files, and client-side storage once it's no longer needed.

## 9. Communication security

- [ ] Enforce TLS for all external and, where feasible, internal service-to-service traffic.
- [ ] Validate certificates; do not disable verification to work around an environment issue.
- [ ] Set security headers appropriate to the app (CSP, HSTS, X-Content-Type-Options, etc.) for anything serving HTML.

## 10. System configuration

- [ ] Disable directory listing, debug endpoints, and verbose error pages in production.
- [ ] Keep runtime, framework, and OS patched; track EOL dates for anything still in use.
- [ ] Remove default accounts and sample/demo code before deployment.

## 11. Database security

- [ ] Use parameterized queries or a vetted ORM for every query touching external input — no string-built SQL.
- [ ] Apply least-privilege database credentials per service (no shared superuser connection).
- [ ] Disable verbose database error messages reaching the client.

## 12. File management

- [ ] Validate file type by content, not just extension or client-supplied MIME type, for uploads.
- [ ] Store uploads outside the web root, or serve them with a content-disposition/type that prevents execution.
- [ ] Reject path traversal in any user-influenced file path (`..`, absolute paths, symlink escapes).

## 13. Memory and general coding practices

- [ ] In memory-unsafe languages, keep content validation (what bytes are legal) and capacity/bounds reasoning (how many bytes fit) as two separate checks — a content-valid string can still overflow a fixed buffer.
- [ ] Remove commented-out code, debug hooks, and TODOs that bypass a security check before merge.
- [ ] Fail securely: an unhandled exception path must not leave the system in a more permissive state than before the request.

## Modern additions not covered by the 2010-era baseline

- [ ] **Dependency / supply chain** — run SCA against new or updated dependencies; pin versions; keep a lockfile; generate/update an SBOM where the repository already does so.
- [ ] **Secrets management** — no secret in source, config committed to VCS, log line, or (for agentic changes) a prompt; use a secrets manager with short-lived credentials where available.
- [ ] **Cloud / IaC configuration** — least-privilege IAM by default; no public storage buckets, ports, or security groups without an explicit, reviewed exception; check for drift between declared and actual config.
- [ ] **CI/CD** — no plaintext secrets in pipeline definitions or logs; verify third-party actions/plugins are pinned to a commit SHA, not a mutable tag.

## Further reading

- [OWASP Secure Coding Practices Quick Reference Guide](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/) — the source of the 13-section structure above
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — per-topic deep dives (Input Validation, SQL Injection Prevention, Authentication, Session Management, Cryptographic Storage, etc.)
- For AI/agent-specific additions to this checklist (prompt handling, tool-use authorization, delegated credentials), see `agentic-ai-security.md`
