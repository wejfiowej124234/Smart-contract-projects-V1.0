# Project documentation (docs)

**Convention**: The main folder keeps only **essential docs** (lead/review + P0–P6). Everything else is in **archive/** for reference.

**All 6 main docs are suitable for project leads and interviewers.** The only difference: for interviewers, **hide or delete `docs/archive/`** (see below).

---

## For interviewers (what to hide)

When sharing this repo with an **interviewer**:

- **Keep**: All 6 main files (or only **PROJECT_LEAD_REVIEW.md** + **Technical_Overview_and_Entry.md**; **REPO_AUDIT.md** for a quick “what’s in the repo” snapshot).
- **Hide or remove**: The **`docs/archive/`** folder — internal process docs, audit checklists, cleanup notes, scripts. Omit it when packaging or cloning for them.

---

## Where to start (project lead)

You only need these **2**:

1. **[PROJECT_LEAD_REVIEW.md](PROJECT_LEAD_REVIEW.md)** — Repo structure, standards, self-check (English).
2. **[Technical_Overview_and_Entry.md](Technical_Overview_and_Entry.md)** — Tech stack, run and verify, doc index.

---

## Main folder (6 files)

| File | Purpose |
|------|---------|
| **README.md** | This index |
| **PROJECT_LEAD_REVIEW.md** | Full repo review + self-check (English) |
| **Technical_Overview_and_Entry.md** | Technical overview and run guide |
| **P0_P6_Summary.md** | P0–P6 design / implementation / acceptance overview |
| **P6_Completion_Assessment.md** | P6 completion and tech-style assessment |
| **REPO_AUDIT.md** | What is tracked in the repo; verification checklist (for reviewer) |

---

## Archive (not in this repo)

**Note**: This repo does **not** include `docs/archive/`. The 6 main docs above are enough to present and verify the project. Any archive (audit reports, checklists, etc.) is local-only and not pushed.

---

## Public clone

Anyone who clones this repository gets only the tracked files above. No archive or internal docs are included; the repo is ready for reviewers to run and verify (see [REPO_AUDIT.md](REPO_AUDIT.md)).

---

## Items removed from the repo (not for lead/interviewer)

The following are in **`.gitignore`** and no longer tracked; they do **not** appear on GitHub. You can keep them locally.

| Type | Description |
|------|-------------|
| **.cursorrules** | Cursor IDE rules, internal tool config |
| **docs/archive/** | Process docs, audit checklists (see above) |
| **slides/dist/** | Exported slide HTML, QA screenshots (_pagecheck_*) |
| **Slides internal** | Content checks, final review, optimization/speaker/review reports, PDF and recording notes |
| **Root** | generate-pdf.bat, GeneratePDF.bat (local only when needed) |

**Slides** kept in the repo: `INTERVIEW_DECK.en.md`, `README.md`, `assets/*.svg` (Chinese deck and speaker script are local-only, not in repo).
