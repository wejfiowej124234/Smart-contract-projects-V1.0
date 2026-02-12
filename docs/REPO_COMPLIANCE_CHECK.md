# Git repository compliance check

**Checked against**: Project requirements (interviewer-facing, public, clean, English-only self-description, no sensitive wording, clone-and-verify ready).

**Date**: Based on current `git ls-files` and tracked content.

---

## 1. Tracked content only (what’s in the repo)

| Category | In repo | Status |
|----------|---------|--------|
| **Root docs** | README.md, PROJECT_OVERVIEW.md, LOCAL_RUN.md, SECURITY.md, CONTRIBUTING.md | ✅ Only project docs |
| **docs/** | README.md, PROJECT_LEAD_REVIEW.md, Technical_Overview_and_Entry.md, P0_P6_Summary.md, P6_Completion_Assessment.md, REPO_AUDIT.md | ✅ 6 files, no archive |
| **Scripts** | deploy.ts, _lib/export.ts, _lib/fs.ts, smoke-e2e.mjs, README.md | ✅ No internal scripts |
| **Slides** | INTERVIEW_DECK.en.md, README.md, assets/*.svg (7) | ✅ English only |
| **Contracts** | SimpleLending.sol, TestToken.sol | ✅ |
| **Frontend** | Full app + ABIs + deployments.json | ✅ |
| **Test** | SimpleLending.integration.ts | ✅ |
| **CI** | .github/workflows/ci.yml | ✅ |

**Not in repo (correctly ignored)**: learning/, docs/archive/, CHANGELOG, PUBLIC_RELEASE_CHECKLIST, README_CODING_TEST_CHECKLIST, CODING_TEST_PITFALLS, internal scripts (demo-ui, clean-slides-dist, seed-solc-cache, etc.), Chinese slides, AUDIT_LOCAL, ACCEPTANCE_STATUS.

---

## 2. Sensitive wording (tracked .md only)

| Check | Result |
|-------|--------|
| No “assignment” / “coding test” / “exam” in self-description | ✅ README, PROJECT_OVERVIEW, SECURITY, CONTRIBUTING, LOCAL_RUN, frontend/README, scripts/README: none |
| No “exploit” in SECURITY.md | ✅ Uses “reproduction details / attack steps” |
| REPO_AUDIT.md | Only mentions these terms in the “Content policy” line (describing the rule); acceptable |

---

## 3. Links (README and docs)

All linked targets exist as tracked files:

- docs/README.md, Technical_Overview_and_Entry.md, P0_P6_Summary.md, P6_Completion_Assessment.md, REPO_AUDIT.md, PROJECT_LEAD_REVIEW.md
- LOCAL_RUN.md, PROJECT_OVERVIEW.md, SECURITY.md, CONTRIBUTING.md
- frontend/src/* and slides/ references

No links to docs/archive/ or missing files.

---

## 4. package.json scripts

| Script | Points to | In repo? |
|--------|-----------|----------|
| deploy:localhost | scripts/deploy.ts | ✅ |
| smoke:e2e | scripts/smoke-e2e.mjs | ✅ |
| slides:pdf, slides:html | slides/INTERVIEW_DECK.en.md | ✅ |
| ci:local | compile, test, frontend lint/build | ✅ |

No scripts reference gitignored or missing files.

---

## 5. Interviewer clone-and-verify

| Requirement | Status |
|-------------|--------|
| README states repo is self-contained and public | ✅ |
| One-command verify: `npm ci` + `npm run ci:local` | ✅ Documented |
| Three-terminal run (node, deploy, frontend) | ✅ In README “Interviewer quick verify” |
| Optional smoke: `npm run smoke:e2e` | ✅ Documented |
| REPO_AUDIT.md lists tracked files and steps | ✅ |

---

## 6. Summary

| Requirement | Compliant |
|-------------|-----------|
| Only project-related content in repo | ✅ |
| Self-description in English, no sensitive wording | ✅ |
| No internal/process docs (changelog, checklists) in repo | ✅ |
| No broken links | ✅ |
| Scripts only reference existing files | ✅ |
| Interviewer can clone and verify | ✅ |

**Conclusion**: The Git repository content **meets the stated requirements**. The repo is suitable for public sharing and for an interviewer to clone and verify.
