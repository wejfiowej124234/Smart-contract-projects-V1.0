# Project documentation (docs)

**Convention**: The main folder keeps only **essential docs** (lead/review + P0–P6). Everything else is in **archive/** for reference.

**All 5 main docs are suitable for project leads and interviewers.** The only difference: for interviewers, **hide or delete `docs/archive/`** (see below).

---

## For interviewers (what to hide)

When sharing this repo with an **interviewer**:

- **Keep**: All 5 main files (or only **PROJECT_LEAD_REVIEW.md** + **Technical_Overview_and_Entry.md**).
- **Hide or remove**: The **`docs/archive/`** folder — internal process docs, audit checklists, cleanup notes, scripts. Omit it when packaging or cloning for them.

---

## Where to start (project lead)

You only need these **2**:

1. **[PROJECT_LEAD_REVIEW.md](PROJECT_LEAD_REVIEW.md)** — Repo structure, standards, self-check (English).
2. **[Technical_Overview_and_Entry.md](Technical_Overview_and_Entry.md)** — Tech stack, run and verify, doc index.

---

## Main folder (5 files)

| File | Purpose |
|------|---------|
| **README.md** | This index |
| **PROJECT_LEAD_REVIEW.md** | Full repo review + self-check (English) |
| **Technical_Overview_and_Entry.md** | Technical overview and run guide |
| **P0_P6_Summary.md** | P0–P6 design / implementation / acceptance overview |
| **P6_Completion_Assessment.md** | P6 completion and tech-style assessment |

---

## Archive (archive/)

**Contents**: Audit reports, security audits, UI/UX audits, requirement mapping, demo checklists, code-style and comment audits, deep-check reports, doc cleanup notes, scripts. The 5 main docs are enough to present the project; archive is for history and on-demand lookup.

List: [archive/README.md](archive/README.md).

**When sharing with an interviewer**: Hide or delete the **archive** folder.

---

## Git and archive

- If you **push** `docs/archive/` to Git, anyone who clones will see it.
- To **hide archive from interviewers**: Add `docs/archive/` to **`.gitignore`** at the repo root so Git does not track it; your local copy can still keep it.

---

## Items removed from the repo (not for lead/interviewer)

The following are in **`.gitignore`** and no longer tracked; they do **not** appear on GitHub. You can keep them locally.

| Type | Description |
|------|-------------|
| **.cursorrules** | Cursor IDE rules, internal tool config |
| **docs/archive/** | Process docs, audit checklists (see above) |
| **slides/dist/** | Exported slide HTML, QA screenshots (_pagecheck_*) |
| **Slides internal** | Content checks, final review, optimization/speaker/exam reports, PDF and recording notes |
| **Scripts internal** | move-docs-to-archive, split-app-css, check-slide-margins, clean-slides-dist, demo-ui, generate-pdf |
| **Root** | generate-pdf.bat, 生成PDF.bat |

**Slides** kept in the repo: `INTERVIEW_DECK.en.md`, `INTERVIEW_DECK.zh-cn.md`, `SPEAKER_SCRIPT.zh-cn.md`, `README.md`, `assets/*.svg`.
