# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0](https://github.com/badrusiddique/noor/compare/v0.1.0...v0.2.0) (2026-05-01)


### Features

* **data:** implement Phase 1a SQLite build pipeline ([25e1370](https://github.com/badrusiddique/noor/commit/25e13704c4ebec4ab4ad94404f9c63babf6141d7))
* **data:** Phase 1b — fonts, audio bundle, transliteration, render-assert stub ([#21](https://github.com/badrusiddique/noor/issues/21)) ([83323c7](https://github.com/badrusiddique/noor/commit/83323c7556b1a27c11180cc31b5930387d586bbe))
* **theme:** wire Noor app icon set + align tokens with logo palette ([#19](https://github.com/badrusiddique/noor/issues/19)) ([f05902e](https://github.com/badrusiddique/noor/commit/f05902e3e2ae85e83dd95b86795b815a4405439b))


### Build

* fix Phase 0 toolchain — eslint flat config, jest setup, prettier pass ([094413a](https://github.com/badrusiddique/noor/commit/094413a8484d219e502c782cea39f8abbb228f8e))


### CI

* fix workflow pnpm pin + remove unresolvable OSV action ([#16](https://github.com/badrusiddique/noor/issues/16)) ([741803d](https://github.com/badrusiddique/noor/commit/741803d2ad1a89f3c0e19f513e97cd190cbc9cff))
* **release:** defer EAS Build (Android + iOS) until v1.* tags ([#22](https://github.com/badrusiddique/noor/issues/22)) ([3f0e9bc](https://github.com/badrusiddique/noor/commit/3f0e9bc1f948e1a7986cabb6342ba1906dc99e09))

## [Unreleased]

## [0.1.0] - 2026-05-02
### Added
- Initial bootstrap: Expo + React Native + TypeScript scaffold.
- ESLint, Prettier, Jest, Husky, commitlint configuration.
- GitHub Actions CI, supply-chain, release-please, EAS build/submit, nightly E2E workflows.
- Architecture Decision Records 0001-0010 documenting all locked stack decisions.
- Documentation: README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, QA-MATRIX, KEYSTORE, BACKEND-HONESTY, THIRD_PARTY_NOTICES.
- i18n scaffolding for English and Urdu (empty dictionaries).

[Unreleased]: https://github.com/badrusiddique/noor/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/badrusiddique/noor/releases/tag/v0.1.0
