# Security Policy

## Reporting a vulnerability

If you discover a security issue in Noor, please report it privately. **Do not open a public GitHub issue** for security problems.

**Contact:** badru.siddique@hudl.com

Include:

1. A description of the issue.
2. Steps to reproduce.
3. The version of Noor and the device/OS where you reproduced it.
4. Any proof-of-concept or relevant logs.
5. Your name or handle if you'd like credit (optional).

You can expect:

- An acknowledgement within 5 business days.
- A triage decision within 14 days.
- A fix in a patch release if the issue is confirmed and reproducible.

Please give the maintainer a reasonable window to fix the issue before public disclosure. We aim for 90 days max.

## In scope

- SSL pinning bypass for the audio CDN domains (`everyayah.com`, `download.quranicaudio.com`).
- Deep-link injection (`noor://...`) leading to crashes, data exposure, or unauthorized actions.
- Local SQLite or file-system sandbox escape.
- Audio cache tampering that affects playback integrity.
- Build supply-chain issues (compromised dependency, build provenance forgery).
- Accidental exposure of PII (none should be transmitted; if you find any, that's a bug).

## Out of scope

- Issues that require a rooted or jailbroken device.
- Issues that require physical access to an unlocked device.
- Social-engineering attacks against the user.
- Denial-of-service via slow-network or low-storage scenarios (these are UX issues, not security).
- The audio CDN going down (a CDN-availability issue, not a vulnerability).

## Threat model summary

Noor is a **read-mostly, no-account, no-backend** app. The data plane is:

- A bundled SQLite database (Quran text + translations + page map). Read-only at runtime.
- A writable copy of that DB in `documentDirectory/`, holding user-created bookmarks/highlights/notes/history.
- An LRU audio cache in `cacheDirectory/`.

Network calls at runtime are limited to the audio CDNs and (optionally, if the user opts in) Sentry crash reporting. SSL pinning is enforced for the audio CDN domains.

The trust boundary is the iOS/Android app sandbox. Outside the sandbox is treated as untrusted.

## Coordinated disclosure

Once a fix is shipped, we'll publish an advisory in the GitHub Security tab and credit the reporter (with their permission). For critical issues we'll also note the fix in `CHANGELOG.md`.

## Scope of this policy

This policy applies to the latest tagged release and the `main` branch. Older tagged versions are not maintained.
