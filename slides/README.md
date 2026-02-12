# Slides

Slides are maintained with **Marp** (Markdown → HTML/PDF). This repo includes the English deck only.

## Contents

- **INTERVIEW_DECK.en.md** — Main slide deck (English).
- **assets/*.svg** — Diagrams (architecture, pipeline, LTV, tx state machine, etc.).

## Export (from repo root)

- **PDF**: `npm run slides:pdf`
- **HTML**: `npm run slides:html`

Output goes to `slides/dist/` (this folder is gitignored).

## VS Code

Install the **Marp for VS Code** extension (`marp-team.marp-vscode`), then open `INTERVIEW_DECK.en.md` to preview or export.

## Workflow

1. Run the app demo first (node, deploy, frontend dev) so the flow is familiar.
2. Use the slides as a speaking outline; keep text minimal.
