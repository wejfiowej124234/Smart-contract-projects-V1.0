# Multi-Dimension Pre-Push Check (深度多维度检查)

**Purpose:** Before uploading to a Git hosting platform (e.g. GitHub), ensure the repository is safe for public hosting: no forbidden or sensitive content, no secrets, clear disclaimers, and platform-compliant wording.

**Date:** Fill when run.  
**Scope:** Root README, SECURITY.md, CONTRIBUTING.md, docs index, frontend UI strings, and any user-facing text.

---

## 1. Forbidden / sensitive content (禁文与敏感内容)

| Check | Result | Notes |
|-------|--------|--------|
| No investment or financial advice claims | ✅ | UI and docs state "does not constitute financial advice"; "DeFi involves risk"; "use only what you can afford to lose" (see frontend config/ui.ts, SECURITY.md). |
| No guaranteed returns or zero-risk wording | ✅ | SECURITY.md says "does not provide a guaranteed SLA"; docs use "best-effort". No "guaranteed profit" or "zero risk" in user-facing text. |
| No illegal activity or promotion | ✅ | Governance docs mention regulation/illegality only in a factual, design-context way (e.g. "regulation can make the current design illegal in some jurisdictions" as a risk). No promotion of illegal use. |
| No offensive or abusive language | ✅ | Scanned; no slurs, abuse, or platform-prohibited language in code or docs. |
| No exposed secrets | ✅ | No private keys, mnemonics, or API keys in tracked files. `.gitignore` covers `.env`, `frontend/.env`, `frontend/.env.*`. Docs that mention `B4_SIGNER_PRIVATE_KEY` / `PRIVATE_KEY` describe runtime env vars only, not stored values. |
| No misleading "official" or endorsement claims | ✅ | Repo describes itself as demo/portfolio and local-only; no false "official" or third-party endorsement. |

**Conclusion:** Repository content is suitable for public hosting and does not contain forbidden or sensitive text that would risk account or repository suspension.

---

## 2. Self-description and README (自述与首页)

| Check | Result | Notes |
|-------|--------|--------|
| README is technical and neutral | ✅ | README describes scope, structure, runbooks, and verification; no investment or legal advice. |
| Clear disclaimer present | ✅ | See REPO_DESCRIPTION.md (or README disclaimer block): educational/demo only; not financial/legal/investment advice. |
| No promise of returns or safety | ✅ | Wording focuses on "risk", "local-only", "best-effort", and compliance disclaimers. |

---

## 3. Platform-safe wording (平台安全表述)

Recommended phrasing in any public-facing description:

- **Use:** "Educational and local demonstration only."
- **Use:** "Does not constitute financial, legal, or investment advice."
- **Use:** "DeFi involves risk; you may lose funds."
- **Avoid:** "Guaranteed", "zero risk", "safe investment", "recommend buying", or any promise of returns.
- **Avoid:** Storing or documenting real private keys, mnemonics, or API keys.

The repository already follows these rules in UI copy (e.g. RiskDisclaimerBanner) and in SECURITY.md.

---

## 4. Quick verification commands

```bash
# Ensure no .env or keys in tracked files
git ls-files | xargs grep -l 'PRIVATE_KEY\|mnemonic\|API_KEY' 2>/dev/null || true
# Expected: only scripts/docs that *reference* env var names (e.g. B4_SIGNER_PRIVATE_KEY), not files containing actual secret values.

# Ensure .gitignore covers secrets
grep -E '\.env|secret|\.key' .gitignore
```

---

## 5. Checklist before push

- [ ] This multi-dimension check has been reviewed.
- [ ] README (and REPO_DESCRIPTION.md if used) contains no forbidden or sensitive content.
- [ ] No real secrets (keys, mnemonics, API keys) are in tracked files.
- [ ] User-facing disclaimers (risk, not financial advice) are present and unchanged.
- [ ] Repo description on the platform (e.g. GitHub "About") is short, neutral, and technical.

**Summary:** The repository is in a platform-safe state. Keep disclaimers and avoid adding any content that promises returns, gives financial/legal advice, or exposes secrets.
