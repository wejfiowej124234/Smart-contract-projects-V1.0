# Changelog

## v1.0.0 (P0–P10 Engineering-Complete, Local-Only)

- **Single version source**: `package.json` `"version": "1.0.0"`.
- **Single acceptance entry**: `npm run p10:gate` (port check → start chain → p10:ci including e2e:ui → evidence-pack); failure → exit 1.
- **Scope**: Proxy and upgradeability; reserve and rate modules; access control and pause; multi-asset configuration; aToken/debtToken; oracle and risk controls; liquidation and Treasury; governance and emergency; Playwright UI E2E in gate; Path A one-click demo (`demo:chain`, `demo:frontend`).
- **Documentation**: README and SECURITY.md aligned with P0–P10 scope; release declaration and signed release document added.

## v0.1.0

- Initial implementation for coding assignment
