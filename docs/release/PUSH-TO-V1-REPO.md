# Push to new repo (Smart-contract-projects-V1.0)

**New repository:** https://github.com/wejfiowej124234/Smart-contract-projects-V1.0

## Already done

- Remote **`v1`** has been added pointing to the new repo:
  - `git remote add v1 https://github.com/wejfiowej124234/Smart-contract-projects-V1.0.git`
  - Check: `git remote -v` (you should see `v1` and `origin`)

## What gets pushed (only code-related)

Git will push **only tracked files**. The following are already excluded by `.gitignore` (they will **not** be uploaded):

- `node_modules/`, `artifacts/`, `cache/`, `frontend/dist/`, `frontend/node_modules/`
- `.env`, `frontend/.env`, `frontend/.env.*` (secrets)
- `learning/`, `slides/`, `docs/archive/` (internal / not for repo)
- `*.pdf`, `*.docx`, `*.zip`, logs, local-only scripts (see .gitignore)

**Uploaded** = source code (`contracts/`, `frontend/src/`, `scripts/`, `test/`), config (`package.json`, `hardhat.config.ts`, `deployments/`), and **code-related docs** (e.g. `docs/` except archive, `README.md`, `SECURITY.md`, `REPO_DESCRIPTION.md`, `LOCAL_RUN.md`, `RELEASE_CHECKLIST_P10.md`, etc.).

## Push from your machine

In the project root (PowerShell or CMD; if Git Bash gives CreateFileMapping error, use PowerShell):

```bash
cd "c:\Users\plant\Desktop\Smart contract projects"
git push -u v1 main
```

If the new repo is empty and you want to push **only** the current state of `main` (no other branches):

```bash
git push -u v1 main
```

To push and set `v1` as the default remote for `main`:

```bash
git push -u v1 main
```

If you prefer SSH instead of HTTPS for `v1`:

```bash
git remote set-url v1 git@github.com:wejfiowej124234/Smart-contract-projects-V1.0.git
git push -u v1 main
```

## If connection fails

- Check internet / VPN / firewall.
- Retry: `git push -u v1 main`
- Or push from GitHub Desktop / another Git client after adding the same remote.

## After first push

- On GitHub: set repo description (e.g. from [REPO_DESCRIPTION.md](../../REPO_DESCRIPTION.md) Short/Medium).
- Optional: in this repo, to use the new repo as default: `git push -u v1 main` then later you can change origin to v1 if you want.
