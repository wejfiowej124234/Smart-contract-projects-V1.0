# Public Release Checklist (this repo)

This repo is designed to be reproducible for an assignment. If you plan to make it public, use this checklist to avoid leaking private/copyrighted material.

## 1) Remove non-source / copyrighted files

Ensure these are NOT committed:
- PDFs / DOCX / ZIP artifacts (JD, assignment PDF, translated docs)
- Any `_translation_work/` output

## 2) Secrets hygiene

Confirm there are no secrets in the repo:
- `.env` is not committed
- No private keys / mnemonics / API keys in any file

## 3) Reproducibility gates

Run local CI-equivalent checks:

```bash
npm run ci:local
npm run audit:prod
```

## 4) Scope clarity

Confirm docs communicate boundaries (no scope creep):
- `README.md` has Scope & Non-Goals
- `SECURITY.md` states “not audited / not for mainnet”

## 5) Optional: share as private

If the assignment/JD content has any usage restrictions, prefer a private repo and share access with reviewers.
